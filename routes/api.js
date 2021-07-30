'use strict';

const ObjectID = require('mongodb').ObjectID;



module.exports = function(app, myDataBase) {

  app.route('/api/issues/:project')

    .get(function(req, res) {
      let {
        _id,
        open,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
      } = req.query;
      // handel open is not undefiend
      // if (open) {
      //   open = JSON.parse(open)
      // }
  // 
      console.log(open != ''||typeof open !== 'undefined' );
      myDataBase.aggregate(
        [
          { $match: { project: req.params.project } },
          { $unwind: '$issues' },
          _id != '' ? { $match: { "issues._id": new ObjectID(_id) } } : { $match: {} },
          (open != ''&&typeof open !== 'undefined' )? { $match: { "issues.open": JSON.parse(open) } } : { $match: {} },
          issue_title != '' ? { $match: { "issues.issue_title": issue_title } } : { $match: {} },
          issue_text != '' ? { $match: { "issues.issue_text": issue_text } } : { $match: {} },
          created_by != '' ? { $match: { "issues.created_by": created_by } } : { $match: {} },
          assigned_to != '' ? { $match: { "issues.assigned_to": assigned_to } } : { $match: {} },
          status_text != '' ? { $match: { "issues.status_text": status_text } } : { $match: {} },
          {
            $group: {
              '_id': '$project',
              'issues': {
                '$push': '$issues'
              }
            }
          }
        ]
      ).toArray()
        .then(data => {
          // let issues = respond.map((item) => item.issues);
          // console.log(data)

          if (!data || data.length == 0) {
            res.json([]);
          } else {
            let mappedData = data[0].issues.map((item) => item);
            // console.log(mappedData)
            res.json(mappedData);
          }
        })

    })

    .post(function(req, res) {
      let project = req.params.project;
      // handle required field(s) missing
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
        return res.json({ error: 'required field(s) missing' });
      const newIssue = {
        _id: new ObjectID(),
        issue_title: req.body.issue_title || '',
        issue_text: req.body.issue_text || '',
        created_by: req.body.created_by || '',
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };
      myDataBase.findOneAndUpdate({ project: project }, {
        $setOnInsert: { // handel new project has issue (must add upsert: true in options)
          project: project
        },
        $push: { issues: newIssue }
      }, { upsert: true, returnNewDocument: true },
        (err, result) => {
          // console.log(err);
          // console.log(result);
          if (err) {
            res.send("error");
          }
          return res.json(newIssue);
        }

      );
    })

    .put(function(req, res) {

      let project = req.params.project;
      // console.log('PUTTT ' + project);

      let {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;
      if (!_id) {
        res.json({ error: "missing _id" });
        return;
      }
      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        !open
      ) {
        res.json({ error: "no update field(s) sent", _id: _id });
        return;
      }
      myDataBase.findOne({ project: project }, (err, project) => {
        if (err || !project) {
          res.json({ error: "could not update", _id: _id });
        }
        else {
          const [issueData] = project.issues.filter(issue => issue._id == _id);

          if (!issueData) {
            res.json({ error: "could not update", _id: _id });
            return;
          }

          issueData.issue_title = issue_title || issueData.issue_title;
          issueData.issue_text = issue_text || issueData.issue_text;
          issueData.created_by = created_by || issueData.created_by;
          issueData.assigned_to = assigned_to || issueData.assigned_to;
          issueData.status_text = status_text || issueData.status_text;
          issueData.updated_on = new Date();

          // handel open is not undefiend String to bollean
          if (open) {
            issueData.open = JSON.parse(open)
          }


          myDataBase.updateOne({ 'issues._id': new ObjectID(_id) }, { $set: { 'issues.$': issueData } }, (err, result) => {
            // console.log(`${_id} ${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);


            if (err || !result) {
              res.json({ error: "could not update", _id: new ObjectID(_id) });
            } else {
              // console.log({ result: "successfully updated", _id: new ObjectID(_id) });
              res.json({ result: "successfully updated", _id: new ObjectID(_id) });
            }
          }
          )
        }

      });

    })

    .delete(function(req, res) {
      let project = req.params.project;
      let { _id } = req.body;
      //handel  delete request  does not include an _id
      if (!_id) {
        res.json({ error: "missing _id" });
        return;
      }

       myDataBase.findOne({ project: project,'issues._id':new ObjectID(_id) }, (err, project) => {
        if (err || !project) {

          res.json({ error: "could not delete", _id: new ObjectID(_id) });
        }
        else {
         
          myDataBase.updateOne({ 'issues._id': new ObjectID(_id) }, { $pull: { issues: { _id: new ObjectID(_id) } } }, (err, result) => {
            // console.log(`${_id} ${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);


            if (err || !result) {
              res.json({ error: "could not delete", _id: new ObjectID(_id) });
            } else {
              // console.log({ result: "successfully updated", _id: new ObjectID(_id) });
              res.json({ result: "successfully deleted", _id: new ObjectID(_id) });
            }
          }
          )
        }

      });

//       myDataBase.findOneAndUpdate({ 'project': project }, { $pull: { issues: { _id: new ObjectID(_id) } } }, { returnNewDocument: true }, (err, result) => {
// console.log(result);
//         if (err || !result) {
//           res.json({ error: "could not delete", _id: new ObjectID(_id) });
//         } else {
//           res.json({ result: "successfully deleted", _id: new ObjectID(_id) });
//         }
//       })



    });

  //404 Not Found Middleware
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });


};