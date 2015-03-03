import Ember from 'ember';
import _ from 'lodash';

/**
  Bracket Homepage controller

  @class BracketController
*/
export default Ember.Controller.extend({
  needs: ['application'],
  isMobile: window.__device.mobile,
  /**
  Signal predictingWinners on/off

  @property predictingWinners
  @type Bool
  */
  predictingWinners: true,
  /**
  Signal predictingStandings on/off

  @property predictingStandings
  @type Bool
  */
  predictingStandings: false,
  /**
  Signal currentStandings on/off

  @property currentStandings
  @type Bool
  */
  viewingCurrentStandings: false,
  /**
  Signal wether API has returned data

  @property serviceDown
  @type Bool
  */
  serviceDown: Ember.computed.empty('standings'),
  /**
  Modelized standings data retreived from API

  @property standings
  @type Array
  */
  standings: null,
  /**
  Sort default

  @property playoffSeed
  @type Array
  */
  playoffSeed: ['conference','playoff_seed','first_name'],
  /**
  Standings model sorted by playoff seeds in each conference

  @property librarySortVisible
  @type Array
  */
  librarySortPlayoffSeed: Ember.computed.sort('standings', 'playoffSeed'),
  /**
  Seeds from EAST

  @property librarySortPlayoffSeedEast
  @type Array
  */
  librarySortPlayoffSeedEast: Ember.computed.filterBy('librarySortPlayoffSeed', 'conference', 'EAST'),
  /**
  Seeds from WEST

  @property librarySortPlayoffSeedWest
  @type Array
  */
  librarySortPlayoffSeedWest: Ember.computed.filterBy('librarySortPlayoffSeed', 'conference', 'WEST'),
  /**
  Array of winners chosen by user

  @property winners
  @type Array
  */
  winners: Ember.Object.create({
    one_eight: Ember.Object.create({
      east: null,
      west: null
    }),
    four_five: Ember.Object.create({
      east: null,
      west: null
    }),
    two_seven: Ember.Object.create({
      east: null,
      west: null
    }),
    three_six: Ember.Object.create({
      east: null,
      west: null
    }),
    semis_a: Ember.Object.create({
      east: null,
      west: null
    }),
    semis_b: Ember.Object.create({
      east: null,
      west: null
    }),
    conf: Ember.Object.create({
      east: null,
      west: null
    }),
    champion: null
  }),

  /**
  Signal wether data is simulated or real

  @property simulatedStandings
  @type Bool
  */
  simulatedStandings: false,
  /**
  Signal wether data is simulated or real

  @property simulatedWinners
  @type Bool
  */
  simulatedWinners: false,

  /**
  Close open modals with body event

  @method bodyClickHandler
  */
  bodyClickHandler: function() {
    var self = this;
    Ember.run.schedule('afterRender', function() {
      Ember.$('body').on('touch click', function() {
        self.send('hideSnapshot');
      });
    });
  }.on('init'),

  actions: {
    /**
    Push winner predictions to winners object

    @method predictWinners
    */
    predictWinners: function(team, round) {

      //let app know we are simulating
      this.set('simulatedWinners', true);
      this.set('predictingWinners', true);

      var winners = this.get('winners');

      if (team) {
        var seed = team.get('playoff_seed');
        var conference = team.get('conference');

        //align action items with east or west
        this.set('predictingEast', conference === 'EAST');

        if (round === 'four') {
          winners.set('champion', team);
        }

        if (round === 'three') {
          if (conference === 'EAST') {
            winners.set('conf.east', team);
          }else {
            winners.set('conf.west', team);
          }
        }

        if (round === 'two') {
          var qualifiers_a = [1,8,4,5];
          if (_.contains(qualifiers_a, seed)) {

            if (conference === 'EAST') {
              winners.set('semis_a.east', team);
            }else {
              winners.set('semis_a.west', team);
            }
          } else {
            if (conference === 'EAST') {
              winners.set('semis_b.east', team);
            }else {
              winners.set('semis_b.west', team);
            }
          }
        }

        if (round === 'one') {
          //1 v 8
          if (seed === 1 || seed === 8) {
            if (conference === 'EAST') {
              winners.set('one_eight.east', team);
            } else {
              winners.set('one_eight.west', team);
            }
          }

          //4 v 5
          if (seed === 4 || seed === 5) {
            if (conference === 'EAST') {
              winners.set('four_five.east', team);
            } else {
              winners.set('four_five.west', team);
            }
          }

          //2 v 7
          if (seed === 2 || seed === 7) {
            if (conference === 'EAST') {
              winners.set('two_seven.east', team);
            } else {
              winners.set('two_seven.west', team);
            }
          }

          //3 v 6
          if (seed === 3 || seed === 6) {
            if (conference === 'EAST') {
              winners.set('three_six.east', team);
            } else {
              winners.set('three_six.west', team);
            }
          }
        }
      }



    },
    /**
    Update seeds in standings model

    @method predictSeed
    */
    predictSeed: function(id, seed, direction) {
      var standings = this.get('standings');
      var offset;

      if (direction === 'down' && seed < (standings.length/2)) {
        offset = seed + 1;
      }

      if (direction === 'up' && seed > 0) {
        offset = seed - 1;
      }

      if(offset) {
        var team = standings.findBy('team_id', id);
        var prevTeam = standings.findBy('playoff_seed', offset);

        team.setProperties({
          'playoff_seed': offset,
          'rank': offset
        });

        prevTeam.setProperties({
          'playoff_seed': seed,
          'rank': seed
        });

        //let app know we are simulating
        this.set('simulatedStandings', true);
        this.send('refreshWinners');
      }

    },

    /**
    Revert predictions to actual

    @method refreshStandings
    */
    refreshStandings: function() {
      var standings = this.get('standings');

      _.filter(standings, function(team){
        var cleanSeed = team.get('clean_seed');
        var cleenRank = team.get('clean_rank');
        team.setProperties({
          playoff_seed: cleanSeed,
          rank: cleenRank
        });
      });
      this.set('simulatedStandings', false);
      this.send('refreshWinners');

    },
    /**
    Revert predictions to actual

    @method refreshWinners
    */
    refreshWinners: function() {
      var winners = this.get('winners');
      _.filter(winners, function(item) {
        if (item) {
          item.set('east',null);
          item.set('west',null);
        }
      });
      winners.set('champion', null);
      this.set('simulatedWinners', false);
    },

    /**
    Hide snapshot modal

    @method hideSnapshot
    */
    hideSnapshot: function() {
      this.set('snapshot', false);
    },

    /**
    Send takeSnapshot action in application controller

    @method takeSnapshot
    */
    takeSnapshot: function() {
      this.get('controllers.application').send('takeSnapshot');
    }



  }

});
