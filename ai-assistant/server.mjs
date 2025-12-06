/**
 * OSIA UIN Generator AI Assistant Server
 * Provides conversational AI support using OpenAI GPT-4
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { knowledgeBase, systemPrompt, getContextualKnowledge } from './knowledge-base.mjs';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory session storage (use Redis in production for scaling)
const sessions = new Map();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Get or create a session
 */
function getSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const newId = sessionId || uuidv4();
    sessions.set(newId, {
      id: newId,
      messages: [],
      context: null,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
    return sessions.get(newId);
  }

  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Clean up expired sessions
 */
function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(id);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupSessions, 5 * 60 * 1000);

/**
 * Build context-aware system prompt
 */
function buildSystemPrompt(context, pageContext) {
  let contextualInfo = '';

  if (pageContext) {
    const topics = getContextualKnowledge(pageContext);
    contextualInfo = `\n\nThe user is currently viewing the "${pageContext}" section of the application. `;
    contextualInfo += `Relevant topics to prioritize: ${topics.join(', ')}.`;
  }

  // Add knowledge base summary for context
  const kbSummary = `
Key information available:
- UIN lengths: 12-19 characters depending on population size
- Generation modes: foundational (recommended), random, structured, sector token
- HSM providers: Thales Luna, SafeNet, Utimaco, YubiHSM, AWS CloudHSM
- Pool states: AVAILABLE → PREASSIGNED → ASSIGNED → RETIRED/REVOKED
- Sectors: health, tax, finance, telco, stats, education, social, government
`;

  return systemPrompt + contextualInfo + kbSummary;
}

/**
 * Format knowledge base content for injection
 */
function getRelevantKnowledge(query) {
  const queryLower = query.toLowerCase();
  let relevantContent = [];

  // Match query to knowledge base sections
  if (queryLower.includes('uin') || queryLower.includes('identifier') || queryLower.includes('number')) {
    relevantContent.push({ topic: 'UIN', content: knowledgeBase.uin.definition + '\n' + knowledgeBase.uin.length });
  }
  if (queryLower.includes('length') || queryLower.includes('digit') || queryLower.includes('character')) {
    relevantContent.push({ topic: 'UIN Length', content: knowledgeBase.uin.length });
  }
  if (queryLower.includes('sector') || queryLower.includes('token') || queryLower.includes('privacy')) {
    relevantContent.push({ topic: 'Sector Tokens', content: knowledgeBase.sectorTokens.concept + '\n' + knowledgeBase.sectorTokens.benefits });
  }
  if (queryLower.includes('hsm') || queryLower.includes('hardware') || queryLower.includes('security module')) {
    relevantContent.push({ topic: 'HSM', content: knowledgeBase.hsm.purpose + '\n' + knowledgeBase.hsm.providers });
  }
  if (queryLower.includes('trng') || queryLower.includes('random') || queryLower.includes('entropy')) {
    relevantContent.push({ topic: 'TRNG', content: knowledgeBase.hsm.trng });
  }
  if (queryLower.includes('vault') || queryLower.includes('secret')) {
    relevantContent.push({ topic: 'Vault', content: knowledgeBase.vault.purpose });
  }
  if (queryLower.includes('pool') || queryLower.includes('pregenerat') || queryLower.includes('lifecycle')) {
    relevantContent.push({ topic: 'Pool Management', content: knowledgeBase.pool.concept + '\n' + knowledgeBase.pool.lifecycle });
  }
  if (queryLower.includes('osia') || queryLower.includes('standard') || queryLower.includes('api')) {
    relevantContent.push({ topic: 'OSIA', content: knowledgeBase.osia.overview + '\n' + knowledgeBase.osia.purpose });
  }
  if (queryLower.includes('consent') || queryLower.includes('gdpr') || queryLower.includes('permission')) {
    relevantContent.push({ topic: 'Consent', content: knowledgeBase.consent.concept + '\n' + knowledgeBase.consent.gdprCompliance });
  }
  if (queryLower.includes('format') || queryLower.includes('display') || queryLower.includes('separator')) {
    relevantContent.push({ topic: 'Formats', content: knowledgeBase.formats.concept + '\n' + knowledgeBase.formats.bestPractices });
  }
  if (queryLower.includes('mode') || queryLower.includes('foundational') || queryLower.includes('structured')) {
    relevantContent.push({ topic: 'Generation Modes', content: Object.values(knowledgeBase.generationModes).join('\n\n') });
  }
  if (queryLower.includes('national') || queryLower.includes('implement') || queryLower.includes('government')) {
    relevantContent.push({ topic: 'Implementation', content: knowledgeBase.implementation.nationalId });
  }
  if (queryLower.includes('migrat') || queryLower.includes('legacy') || queryLower.includes('existing')) {
    relevantContent.push({ topic: 'Migration', content: knowledgeBase.implementation.migration });
  }
  if (queryLower.includes('checksum') || queryLower.includes('valid') || queryLower.includes('error')) {
    relevantContent.push({ topic: 'Checksum', content: knowledgeBase.uin.checksum });
  }
  if (queryLower.includes('why') || queryLower.includes('embed') || queryLower.includes('sequential')) {
    relevantContent.push({ topic: 'FAQ', content: Object.values(knowledgeBase.faq).join('\n\n') });
  }

  return relevantContent;
}

/**
 * POST /api/chat - Main chat endpoint
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, context: pageContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    const session = getSession(sessionId);

    // Update context if provided
    if (pageContext) {
      session.context = pageContext;
    }

    // Get relevant knowledge for the query
    const relevantKnowledge = getRelevantKnowledge(message);
    let knowledgeContext = '';
    if (relevantKnowledge.length > 0) {
      knowledgeContext = '\n\nRelevant knowledge base information:\n' +
        relevantKnowledge.map(k => `[${k.topic}]\n${k.content}`).join('\n\n');
    }

    // Build messages array for OpenAI
    const messages = [
      {
        role: 'system',
        content: buildSystemPrompt(session.context, pageContext) + knowledgeContext
      },
      ...session.messages.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const assistantMessage = completion.choices[0].message.content;

    // Store messages in session
    session.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );

    // Return response
    res.json({
      sessionId: session.id,
      message: assistantMessage,
      context: session.context
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * POST /api/chat/context-help - Get context-sensitive help suggestions
 */
app.post('/api/chat/context-help', async (req, res) => {
  try {
    const { context, element } = req.body;

    const contextHelp = {
      'generate': {
        suggestions: [
          'What is the difference between foundational and structured mode?',
          'Why is HSM TRNG important for UIN generation?',
          'How many digits should my UIN have?'
        ],
        quickTip: 'Foundational mode is recommended for national ID systems as it provides maximum entropy and no embedded PII.'
      },
      'pool': {
        suggestions: [
          'How does pre-generation improve registration performance?',
          'What happens when a UIN is preassigned?',
          'How long should pre-generated UINs be stored?'
        ],
        quickTip: 'Pre-generate 3-6 months of UIN inventory to ensure smooth operations during peak registration periods.'
      },
      'lookup': {
        suggestions: [
          'What do the different UIN statuses mean?',
          'How can I view the audit trail for a UIN?',
          'Can a revoked UIN be reactivated?'
        ],
        quickTip: 'UINs transition through lifecycle states: AVAILABLE → PREASSIGNED → ASSIGNED → RETIRED/REVOKED'
      },
      'security': {
        suggestions: [
          'What HSM providers are supported?',
          'How does sector tokenization protect privacy?',
          'What secrets are stored in HashiCorp Vault?'
        ],
        quickTip: 'Always use HSM hardware TRNG for production UIN generation. Software PRNG is only suitable for testing.'
      },
      'sector-token': {
        suggestions: [
          'How do sector tokens prevent cross-sector tracking?',
          'Can sector tokens be linked back to the master UIN?',
          'What sectors are supported by default?'
        ],
        quickTip: 'Sector tokens are derived using HMAC-SHA256 with sector-specific secrets stored in Vault.'
      },
      'format': {
        suggestions: [
          'How do I configure UIN display format?',
          'Should I store formatted or raw UINs?',
          'What separator characters are available?'
        ],
        quickTip: 'Always store raw UINs in the database. Format configuration is for display purposes only.'
      }
    };

    const help = contextHelp[context] || {
      suggestions: [
        'What is OSIA and how does it help identity systems?',
        'How do I generate my first UIN?',
        'What security features does this system provide?'
      ],
      quickTip: 'OSIA (Open Standards for Identity APIs) enables interoperability between government identity systems.'
    };

    res.json(help);
  } catch (error) {
    console.error('Context help error:', error);
    res.status(500).json({ error: 'Failed to get context help' });
  }
});

/**
 * GET /api/chat/suggestions - Get conversation starters
 */
app.get('/api/chat/suggestions', (req, res) => {
  const suggestions = [
    {
      category: 'Getting Started',
      questions: [
        'What is a UIN and why do I need one?',
        'How do I generate my first UIN?',
        'What generation mode should I use?'
      ]
    },
    {
      category: 'Technical Questions',
      questions: [
        'How many digits should my UIN have for a population of 50 million?',
        'What is the difference between HSM TRNG and software PRNG?',
        'How does sector tokenization work?'
      ]
    },
    {
      category: 'Implementation',
      questions: [
        'How do I integrate this with my civil registration system?',
        'What are best practices for migrating from a legacy ID system?',
        'How do I set up HSM integration?'
      ]
    },
    {
      category: 'Security & Compliance',
      questions: [
        'Is this system GDPR compliant?',
        'How are secrets protected?',
        'What audit trail capabilities are available?'
      ]
    }
  ];

  res.json(suggestions);
});

/**
 * DELETE /api/chat/session/:sessionId - Clear session
 */
app.delete('/api/chat/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    res.json({ success: true, message: 'Session cleared' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

/**
 * GET /api/chat/health - Health check
 */
app.get('/api/chat/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OSIA UIN AI Assistant',
    model: 'gpt-4o',
    activeSessions: sessions.size
  });
});

// Start server
const PORT = process.env.AI_ASSISTANT_PORT || 19021;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 Anna AI Assistant running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/chat/health`);
  console.log(`   Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});
