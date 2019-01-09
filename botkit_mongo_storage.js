var db = require('monk');
/**
 * botkit-storage-mongo - MongoDB driver for Botkit
 *
 * @param  {Object} config
 * @return {Object}
 */
module.exports = function(config) {

    if (!config || !config.mongoUri)
        throw new Error('Need to provide mongo address.');

    var Teams = db(config.mongoUri).get('teams'),
        Users = db(config.mongoUri).get('users'),
        SFUsers = db(config.mongoUri).get('SFusers'),
        Channels = db(config.mongoUri).get('channels');

    var unwrapFromList = function(cb) {
        return function(err, data) {
            if (err) return cb(err);
            cb(null, data);
        };
    };

    var storage = {
        teams: {
            get: function(id, cb) {
                Teams.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Teams.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Teams.find({}, cb);
            }
        },
        users: {
            get: function(id, cb) {
                Users.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Users.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Users.find({}, cb);
            }
        },
        SFusers: {
            get: function(id, cb) {
                SFUsers.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                SFUsers.findOneAndUpdate({
                    id: data.id,
                    access_token: data.access_token,
                    refresh_token: data.refresh_token
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                SFUsers.find({}, cb);
            }
        },
        channels: {
            get: function(id, cb) {
                Channels.findOne({id: id}, unwrapFromList(cb));
            },
            save: function(data, cb) {
                Channels.findOneAndUpdate({
                    id: data.id
                }, data, {
                    upsert: true,
                    new: true
                }, cb);
            },
            all: function(cb) {
                Channels.find({}, cb);
            }
        }
    };

    return storage;
};
