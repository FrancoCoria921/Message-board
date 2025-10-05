'use strict';

const { Thread } = require('../models/Thread.js');
const bcrypt = require('bcrypt');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password } = req.body;
        const board = req.params.board;
        if (!text || !delete_password) {
          return res.status(400).json({ error: 'missing required fields' });
        }
        const hashedPassword = await bcrypt.hash(delete_password, 12);
        const newThread = new Thread({
          text,
          delete_password: hashedPassword,
          board,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: [],
          replycount: 0
        });
        await newThread.save();
        res.redirect(`/b/${board}/`);
      } catch (error) {
        res.status(500).json({ error: 'could not create thread' });
      }
    })
    .get(async (req, res) => {
      try {
        const board = req.params.board;
        // Get threads sorted by bumped_on descending (most recent first)
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .select('-reported -delete_password -__v')
          .lean();
        // For each thread, limit replies to 3 most recent and don't show reported or delete_password
        const processedThreads = threads.map(thread => {
          let replies = [];
          if (thread.replies && thread.replies.length > 0) {
            // Sort replies by created_on descending (most recent first) and take 3
            replies = [...thread.replies]
              .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
              .slice(0, 3)
              .map(reply => {
                const { delete_password, reported, __v, ...replyData } = reply;
                return replyData;
              });
          }
          return {
            ...thread,
            replies,
            replycount: thread.replycount || 0
          };
        });
        // Ensure most recent thread is at index 0
        res.json(processedThreads);
      } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ error: 'could not fetch threads' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const board = req.params.board;
        
        if (!thread_id || !delete_password) {
          return res.status(400).json({ error: 'missing required fields' });
        }

        const thread = await Thread.findOne({ _id: thread_id, board: board });
        
        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        const passwordMatch = await bcrypt.compare(delete_password, thread.delete_password);
        
        if (!passwordMatch) {
          return res.send('incorrect password');
        }

        await Thread.findByIdAndDelete(thread_id);
        res.send('success');
      } catch (error) {
        res.status(500).json({ error: 'could not delete thread' });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        const board = req.params.board;
        
        if (!thread_id) {
          return res.status(400).json({ error: 'missing thread_id' });
        }

        const thread = await Thread.findOne({ _id: thread_id, board: board });
        
        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send('reported');
      } catch (error) {
        res.status(500).json({ error: 'could not report thread' });
      }
    });
    
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { text, delete_password, thread_id } = req.body;
        const board = req.params.board;
        
        if (!text || !delete_password || !thread_id) {
          return res.status(400).json({ error: 'missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(delete_password, 12);

        const thread = await Thread.findOne({ _id: thread_id, board: board });

        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        // Usar la misma variable de tiempo para evitar diferencias de microsegundos
        const now = new Date();
        const newReply = {
          text: text,
          delete_password: hashedPassword,
          created_on: now,
          reported: false
        };

        thread.replies.push(newReply);
        thread.replycount = thread.replies.length;
        thread.bumped_on = now; // Usar el mismo valor que created_on

        await thread.save();
        res.redirect(`/b/${board}/${thread_id}`);
      } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ error: 'could not create reply' });
      }
    })
    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        const board = req.params.board;
        
        if (!thread_id) {
          return res.status(400).json({ error: 'missing thread_id' });
        }

        const thread = await Thread.findOne({ _id: thread_id, board: board })
          .select('-reported -delete_password -__v')
          .lean();
        
        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        // Ordena los replies por fecha ascendente y elimina campos sensibles
        if (thread.replies && thread.replies.length > 0) {
          thread.replies = [...thread.replies]
            .sort((a, b) => new Date(a.created_on) - new Date(b.created_on))
            .map(reply => {
              const { delete_password, reported, __v, ...replyData } = reply;
              return replyData;
            });
        }

        const { __v, ...threadData } = thread;
        res.json(threadData);
      } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ error: 'could not fetch thread' });
      }
    })
    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const board = req.params.board;
        
        if (!thread_id || !reply_id || !delete_password) {
          return res.status(400).json({ error: 'missing required fields' });
        }

        const thread = await Thread.findOne({ _id: thread_id, board: board });
        
        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        const reply = thread.replies.id(reply_id);
        
        if (!reply) {
          return res.status(404).json({ error: 'reply not found' });
        }

        const passwordMatch = await bcrypt.compare(delete_password, reply.delete_password);
        
        if (!passwordMatch) {
          return res.send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();
        res.send('success');
      } catch (error) {
        res.status(500).json({ error: 'could not delete reply' });
      }
    })
    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const board = req.params.board;
        
        if (!thread_id || !reply_id) {
          return res.status(400).json({ error: 'missing required fields' });
        }

        const thread = await Thread.findOne({ _id: thread_id, board: board });
        
        if (!thread) {
          return res.status(404).json({ error: 'thread not found' });
        }

        const reply = thread.replies.id(reply_id);
        
        if (!reply) {
          return res.status(404).json({ error: 'reply not found' });
        }

        reply.reported = true;
        await thread.save();
        res.send('reported');
      } catch (error) {
        res.status(500).json({ error: 'could not report reply' });
      }
    });

};
