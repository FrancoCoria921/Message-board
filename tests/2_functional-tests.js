const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Thread } = require('../models/Thread.js');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let testThreadId;
  let testReplyId;
  
  this.timeout(10000);

  // Clean database before all tests
  before(async function () {
    await Thread.deleteMany({});
  });

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: 'Test thread for functional testing',
            delete_password: 'testpass123'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
        chai.request(server)
          .get('/api/threads/general')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            if (res.body.length > 0) {
              testThreadId = res.body[0]._id; // Reasignación, no redeclaración
              assert.property(res.body[0], '_id');
              assert.property(res.body[0], 'text');
              assert.property(res.body[0], 'created_on');
              assert.property(res.body[0], 'bumped_on');
              assert.property(res.body[0], 'replies');
              assert.property(res.body[0], 'replycount');
              assert.notProperty(res.body[0], 'delete_password');
              assert.notProperty(res.body[0], 'reported');
              assert.isArray(res.body[0].replies);
              assert.isAtMost(res.body[0].replies.length, 3);
              if (res.body[0].replies.length > 0) {
                assert.property(res.body[0].replies[0], '_id');
                assert.property(res.body[0].replies[0], 'text');
                assert.property(res.body[0].replies[0], 'created_on');
                assert.notProperty(res.body[0].replies[0], 'delete_password');
                assert.notProperty(res.body[0].replies[0], 'reported');
              }
            }
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
        chai.request(server)
          .delete('/api/threads/general')
          .send({
            thread_id: testThreadId,
            delete_password: 'wrongpassword'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
        // First create a thread to delete
        chai.request(server)
          .post('/api/threads/general')
          .send({
            text: 'Thread to be deleted',
            delete_password: 'deletepass123'
          })
          .end(function(err, res) {
            // Get the thread ID
            chai.request(server)
              .get('/api/threads/general')
              .end(function(err, res) {
                const threadToDelete = res.body.find(thread => thread.text === 'Thread to be deleted');
                if (threadToDelete) {
                  chai.request(server)
                    .delete('/api/threads/general')
                    .send({
                      thread_id: threadToDelete._id,
                      delete_password: 'deletepass123'
                    })
                    .end(function(err, res) {
                      assert.equal(res.status, 200);
                      assert.equal(res.text, 'success');
                      done();
                    });
                } else {
                  done(new Error('Could not find thread to delete'));
                }
              });
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
        chai.request(server)
          .put('/api/threads/general')
          .send({
            thread_id: testThreadId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
          });
      });
    });
    
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
        chai.request(server)
          .post('/api/replies/general')
          .send({
            thread_id: testThreadId,
            text: 'Test reply for functional testing',
            delete_password: 'replypass123'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get('/api/replies/general')
          .query({ thread_id: testThreadId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            assert.notProperty(res.body, 'delete_password');
            assert.notProperty(res.body, 'reported');
            assert.isArray(res.body.replies);
            if (res.body.replies.length > 0) {
              testReplyId = res.body.replies[res.body.replies.length - 1]._id; // Reasignación, no redeclaración
              assert.property(res.body.replies[0], '_id');
              assert.property(res.body.replies[0], 'text');
              assert.property(res.body.replies[0], 'created_on');
              assert.notProperty(res.body.replies[0], 'delete_password');
              assert.notProperty(res.body.replies[0], 'reported');
            }
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
        chai.request(server)
          .put('/api/replies/general')
          .send({
            thread_id: testThreadId,
            reply_id: testReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
        chai.request(server)
          .delete('/api/replies/general')
          .send({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: 'wrongpassword'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
      
      test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
        chai.request(server)
          .delete('/api/replies/general')
          .send({
            thread_id: testThreadId,
            reply_id: testReplyId,
            delete_password: 'replypass123'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
  });

});
