import Ember from 'ember';
import { raw as ajax } from 'ic-ajax';
import _ from 'lodash';

/**
  Application route

  @class ApplicationRoute
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
      url: '//nbaplayoffs.in:1338/data.json',
      processData: true
    });

    return req.then(
      function resolve(res) {
        return _.map(res.response.standing, function(item) {
          item.img = 'assets/logos/minimal/'+(item.first_name.replace(/ /g,'') + '-' + item.last_name.replace(/ /g,'')).toLowerCase() + '.png';

          //maintain original rankings for reset
          item.clean_seed = item.playoff_seed;
          item.clean_rank = item.rank;
          //clean up team name for css use
          item.css_name = item.last_name.replace(/ /g, '');
          //class names cannot begin
          if (item.css_name === '76ers') {
            item.css_name = 'Sixers';
          }

          //flag sub 500 teams
          var win_percentage = (_.parseInt(item.win_percentage.replace(/\./, '')))/1000;
          item.sub_five_hundred = win_percentage < 0.5 ? true : false;

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
    var predictorController = this.controllerFor('predictor');
    var promises = [this.get('dataPromise')];

    predictorController.set('isLoadingData', true);

    return Ember.RSVP.allSettled(promises).then(function(res) {
      //console.log(_.first(res).value);
      predictorController.setProperties({
        standings: _.first(res).value,
        isLoadingData: false
      });
    }).catch(function(err) {
      predictorController.set('error', err);
    });
  },

  beforeModel: function() {
    this.asyncRetrieveData();
  }

});
