
const Store = require('../lib/services/storage');
const { expect } = require('chai');
const request = require('supertest');
//const run = require('../run');
//const app = run.app;
const app = require('../run');

describe('Demo test', () => {

  before(function() {
    process.env.ENVIRONMENT = 'test';
    var configuration = {
      'strategy': 'empty',
      'settings': { }
    };
    
    Store.configure(configuration);
  });


  after(done => {
      //run.server.close();
      done();
    });


  it('should respond to ping', (done) => {
    request(app)
      .get('/ping')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        expect(res.text).to.equal('pong');
        done();
      });
  });

  /*

   it('should respond to index route', (done) => {
    request(app)
      .get('/')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain('Welcome!');
        done();
      });
  });
  
  it('should respond to add new Sprint', (done) => {
    request(app)
      .get('/sprints/add')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain('Add new sprint');
        done();
      });
  });
  
  it('should respond to edit available Sprints', (done) => {
    request(app)
      .get('/sprints/edit')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain('All sprints');
        done();
      });
  });

  it('should respond to show the burndown of something', (done) => {
    request(app)
      .get('/sprints/any')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(200);
        expect(res.text).to.contain('Burndown chart');
        done();
      });
  });

  it('should respond to non existing configuration with not-found', (done) => {
    request(app)
      .get('api/sprints/non_existing/configuration')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res.status).to.equal(404);
        done();
      });
  });
  */

});  




