import Ember from 'ember';
import { raw as ajax } from 'ic-ajax';
import _ from 'lodash';

/**
  Bracket Homepage route

  @class BracketRoute
*/
export default Ember.Route.extend({
  title: 'Application',
  /**
    Fetches data from JSON, returns promise

    @property restModel
    @type Promise
  */
  dataPromise: function() {
    var req = ajax({
      type: 'GET',
      url: '//localhost:1338/data.json',
      processData: true
    });

    return req.then(
      function resolve(res) {
        return _.map(res.response.standing, function(item) {
          item.img = 'assets/logos/'+(item.first_name.replace(/ /g,'') + '-' + item.last_name.replace(/ /g,'')).toLowerCase() + '.png';

          //maintain original rankings for reset
          item.clean_seed = item.playoff_seed;
          item.clean_rank = item.rank;

          return Ember.Object.create(item) ;
        });
      }.bind(this)
    ).catch(function(err) {
      console.log(err);
    });
  }.property(),
  /**
    Retrieves promise from API fetch

    @method asyncRetrieveData
  */
  asyncRetrieveData: function() {
    var bracketController = this.controllerFor('bracket');
    var promises = [this.get('dataPromise')];

    bracketController.set('isLoadingData', true);

    return Ember.RSVP.allSettled(promises).then(function(res) {
      //console.log(_.first(res).value);
      bracketController.setProperties({
        standings: _.first(res).value,
        isLoadingData: false
      });
    }).catch(function(err) {
      bracketController.set('error', err);
    });
  },

  beforeModel: function() {
    this.asyncRetrieveData();
  }

});
