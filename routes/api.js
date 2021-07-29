'use strict';

const ObjectID = require('mongodb').ObjectID;



module.exports = function(app, myDataBase) {

    app.route('/api/issues/:project')

    .get(function(req, res) {
        let project = req.params.project;

        const {
            open,
            issue_title,
            issue_text,
            created_by,
            assigned_to,
            status_text,
        } = req.query;

        myDataBase.aggregate(
                [
                    { $match: { project: project } },
                    { $unwind: '$issues' },
                    open != '' ? { $match: { "issues.open": JSON.parse(open) } } : { $match: {} },
                    issue_title != '' ? { $match: { "issues.issue_title": issue_title } } : { $match: {} },
                    issue_text != '' ? { $match: { "issues.issue_text": issue_text } } : { $match: {} },
                    created_by != '' ? { $match: { "issues.created_by": created_by } } : { $match: {} },
                    assigned_to != '' ? { $match: { "issues.assigned_to": assigned_to } } : { $match: {} },
                    status_text != '' ? { $match: { "issues.status_text": status_text } } : { $match: {} }
                ]
            ).toArray()
            .then(respond => {
                let mappedData = respond.map((item) => item.issues);
                return res == null ? res.json([]) : res.json(mappedData);
            })

    })

    .post(function(req, res) {
        let project = req.params.project;
        // handle required field(s) missing
        if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
            return res.json({ error: 'required field(s) missing' });
        const newIssue = {
            _id: new ObjectID(),
            issue_title: req.body.issue_title,
            issue_text: req.body.issue_text,
            created_by: req.body.created_by,
            assigned_to: req.body.assigned_to,
            status_text: req.body.status_text,
            created_on: new Date(),
            updated_on: new Date(),
            open: true
        };
        myDataBase.findOneAndUpdate({ project: project }, {
                $setOnInsert: { // handel new project has issue (must add upsert: true in options)
                    project: project
                },
                $push: { issues: newIssue }
            }, { upsert: true, new: true },
            (err, doc) => {
                return res.json(doc);
            }

        );
    })

    .put(function(req, res) {
        let project = req.params.project;
        let open = JSON.parse(req.body.open);
        let id = new ObjectID(req.body._id);

        //handel  PUT request  does not include an _id
        if (!id)
            return res.json({ error: 'missing _id' });

        // handel PUT request  does not include update fields
        if (!id || !open)
            return res.json({ error: 'no update field(s) sent', '_id': id });

        myDataBase.updateOne({ 'project': project, 'issues._id': id }, { $set: { 'issues.$.open': open, 'issues.$.updated_on': new Date() } }, { new: true },
            (err, result) => {
                console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);

                if (result.matchedCount < 1 || err)
                    return res.json({ error: 'could not update', '_id': id });
                if (result.modifiedCount == 1)
                    return res.json({ result: 'successfully updated', '_id': id });
            }
        )
    })

    .delete(function(req, res) {
        let project = req.params.project;
        let id = new ObjectID(req.body._id);

        //handel  PUT request  does not include an _id
        if (!id)
            return res.json({ error: 'missing _id' });

        myDataBase.findOneAndUpdate({ 'project': project }, { $pull: { issues: { _id: id } } }, { new: true }, (err, result) => {
            if (err) {
                return res.json({ error: 'could not delete', '_id': id });
            }
            return res.json({ result: 'successfully deleted', '_id': id });
        })



    });

    //404 Not Found Middleware
    app.use(function(req, res, next) {
        res.status(404)
            .type('text')
            .send('Not Found');
    });


};