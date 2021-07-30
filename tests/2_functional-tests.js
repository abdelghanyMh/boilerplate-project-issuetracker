const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let deleteME;


suite('Functional Tests', function() {
  suite('1) POST request Tests', () => {
    test('Create an issue with every field: POST to /api/issues/{project}', (done) => {
      chai.request(server)
        .post('/api/issues/projects')
        .set('content-type', 'application/json')
        .send({
          issue_title: "random",
          issue_text: "Post request Tests",
          created_by: "camper",
          assigned_to: "superman",
          status_text: "Not Done",
        })
        .end((err, res) => {
          deleteME = res.body._id;

          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "random");
          assert.equal(res.body.assigned_to, "superman");
          assert.equal(res.body.created_by, "camper");
          assert.equal(res.body.status_text, "Not Done");
          assert.equal(res.body.issue_text, "Post request Tests");
          done();
        });
    })
    test('Create an issue with only required fields', (done) => {
      chai.request(server)
        .post('/api/issues/projects')
        .set('content-type', 'application/json')
        .send({
          issue_title: "onlyRequired",
          issue_text: "Post request Tests 2",
          created_by: "camper",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "onlyRequired");
          assert.equal(res.body.issue_text, "Post request Tests 2");
          assert.equal(res.body.created_by, "camper");
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          done();
        });
    });
    test('Create an issue with missing required fields', (done) => {
      chai.request(server)
        .post('/api/issues/projects')
        .set('content-type', 'application/json')
        .send({
          issue_title: "onlyRequired",
          issue_text: "Post request Tests 2",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "required field(s) missing")
          done();
        });
    });
  });
 
  suite('2) GET request Tests', () => {
    test('View issues on a project: GET request to /api/issues/{project}', (done) => {
      chai
        .request(server)
        .get('/api/issues/gettest')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.length, 1);

          done();
        })
    });
    test('View issues on a project with one filter', (done) => {
      chai
        .request(server)
        .get('/api/issues/gettest')
        .query({
          _id: '6103cb9b68aaa701863ee7a2',
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body[0], {
            _id: "6103cb9bedc58d370e804a81",
            issue_title: "get test",
            issue_text: "DONT EDIT THIS PROJECT",
            created_on: "2021-07-30T09:51:23.670Z",
            updated_on: "2020-12-21T15:41:38.279Z",
            created_by: "CAMPER",
            assigned_to: "CHAI ",
            open: true,
            status_text:"NOT DONE",
          });
          done();
        });

    })
    test('View issues on a project with multiple filters', (done) => {
      chai
        .request(server)
        .get('/api/issues/gettest')
        .query({
           issue_title: "get test",
            issue_text: "DONT EDIT THIS PROJECT",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.deepEqual(res.body[0],{
            _id: "6103cb9bedc58d370e804a81",
            issue_title: "get test",
            issue_text: "DONT EDIT THIS PROJECT",
            created_on: "2021-07-30T09:51:23.670Z",
            updated_on: "2020-12-21T15:41:38.279Z",
            created_by: "CAMPER",
            assigned_to: "CHAI ",
            open: true,
            status_text:"NOT DONE",
          });
          done();
        });

    })
  });

  suite('3) PUT request Tests', () => {
    test('Update one field on an issue: PUT request to /api/issues/{project}', (done) => {

      chai
        .request(server)
        .put("/api/issues/puttest")
        .send({
          _id: "6103e593eefe3a0dced07653",
          issue_title: "different",
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, "6103e593eefe3a0dced07653");

          done();
        })
    })

    test('Update multiple fields on an issue', (done) => {

      chai
        .request(server)
        .put("/api/issues/puttest")
        .send({
          _id: "6103e593eefe3a0dced07653",
          issue_title: "Update",
          issue_text: 'multiple',
          created_by: 'fields'

        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, "successfully updated");
          assert.equal(res.body._id, "6103e593eefe3a0dced07653");

          done();
        })
    })
    test('Update an issue with missing _id', (done) => {

      chai
        .request(server)
        .put("/api/issues/puttest")
        .send({
          issue_title: "Update",
          issue_text: 'multiple',
          created_by: 'fields'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "missing _id");

          done();
        })
    })
    test('Update an issue with no fields to update', (done) => {

      chai
        .request(server)
        .put("/api/issues/puttest")
        .send({
          _id: "6103e593eefe3a0dced07653"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, "6103e593eefe3a0dced07653");
          assert.equal(res.body.error, "no update field(s) sent");
          done();
        })
    })

    test('Update an issue with no fields to update', (done) => {

      chai
        .request(server)
        .put("/api/issues/puttest")
        .send({
          _id: "6103e593eefe3a0dced07654",
          issue_title: "Update",
          issue_text: 'multiple',
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body._id, "6103e593eefe3a0dced07654");
          assert.equal(res.body.error, "could not update");
          done();
        })
    })

  });

  suite('4) DELETE request Tests', () => {
    test('Delete an issue: DELETE request to /api/issues/{project}', (done) => {
      chai
        .request(server)
        .delete("/api/issues/projects")
        .send({
          _id: deleteME
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, "successfully deleted");

          done();
        });
    });

    test('Delete an issue with an invalid _id', (done) => {
      chai
        .request(server)
        .delete("/api/issues/projects")
        .send({
          _id: '6103cb9bedc58d370e804a88'
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "could not delete");

          done();
        });
    });

    test('Delete an issue with missing _id', (done) => {
      chai
        .request(server)
        .delete("/api/issues/projects")
        .send({

        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "missing _id");

          done();
        });
    });
  });
}
);
