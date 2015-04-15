import Ember from 'ember';
import { raw as ajax } from 'ic-ajax';


/**
  Application controller

  @class ApplicationController
*/
export default Ember.Controller.extend({
  needs: ['predictor'],
  isTablet: window.__device.tablet,
  isMobile: window.__device.mobile,
  year: moment().format('YYYY'),

  /**
  Signal if contest has begun

  @property contestStarted
  @type Bool
  */
  contestStarted: false,

  /**
  Signal if current path is predictor, certain menu items should only display on predictor route

  @property isPredictor
  @type Bool
  */
  isPredictor: false,

  /**
  Observe current path

  @method observePath
  */
  observePath: function() {
    this.set('isPredictor', this.get('currentPath') === 'predictor');
  }.observes('currentPath'),


  /**
  Signal menu toggled

  @property menuOpen
  @type Bool
  */
  menuOpen: false,
  /**
  Signal standings sub menu, E W

  @property standingsSubMenuOpen
  @type Bool
  */
  standingsSubMenuOpen: false,
  /**
  Signal if standings scrolled into view

  @property viewingStandings
  @type Bool
  */
  viewingStandings: false,
  /**
  Signal user scroll

  @property scrolled
  @type Bool
  */
  scrolled: false,
  /**
  Alias of controller for predictor

  @property predictor
  @type Alias
  */
  //TODO: Implement
  predictor: Ember.computed.alias('controller.predictor'),
  /**
  Toggle menu/menu items upon scrolling

  @method scrollHandler
  */
  scrollHandler: function() {

    if(this.get('scrolled') && this.get('menuOpen')) {
      this.set('menuOpen', false);
    }else {
      if (!this.get('isMobile')) {
        this.set('menuOpen', true);
        this.set('controllers.predictor.predictingStandings', false);
        this.set('controllers.predictor.viewingCurrentStandings', false);
      }
    }

  }.observes('scrolled'),
  /**
  Add scroll event listener to window

  @method scrollListener
  */
  scrollListener: function() {
    var self = this;
    Ember.run.schedule('afterRender', function(){
      Ember.$(window).on('scroll', function(){
        if(Ember.$(window).scrollTop() > 90) {
          self.set('scrolled', true);
        }else {
          self.set('scrolled', false);
        }

        self.set('viewingStandings', Ember.$(window).scrollTop() >= Ember.$('#standings').position().top);

      });
    });
  }.on('init'),

  /**
  Add resize event listener to window

  @method scrollListener
  */
  resizeListener: function() {
    var self = this;
    Ember.run.schedule('afterRender', function(){
      Ember.$(window).on('resize', function(){
        if(Ember.$(window).outerWidth() < 1080) {
          self.set('minSize', true);
          self.set('menuOpen', false);
        }else {
          if (!self.get('scrolled')) {
            self.set('menuOpen', true);
          }
        }
      });
    });
  }.on('init'),


  /**
  Once a snapshot has been posted to imgur, generate a Facebook dialogue

  @method publishToFB
  */
  publishToFB: function() {
    var img = this.get('controllers.predictor.imgurUrl');
    Ember.run.schedule('afterRender', function() {
      var $fb = Ember.$('.fb-share');
      //facebook feed dialog (https://developers.facebook.com/docs/sharing/reference/feed-dialog/v2.0)
      $fb.attr({
        href: 'https://www.facebook.com/dialog/feed?app_id=716175178500550&display=page&caption=My%20NBA%20Playoffs%20predictions //NBAPlayoffs.in&picture='+img+'&link='+encodeURIComponent(img)+'&redirect_uri=http://facebook.com'
      });

      //facebook meta
      var $fbmeta = Ember.$('meta[content="og:image"]');
      $fbmeta.attr('content', img);

    });

  }.observes('controllers.predictor.imgurUrl'),

  /**
  Post the base 64 of the snapshot to imgur for remote hosting

  @method publishToImgur
  */
  publishToImgur: function(dataurl) {
    var self = this;
    var base64 = dataurl.replace(/(.*)\,/, '');
    //reference: https://github.com/eirikb/gifie/blob/ebce7e10ad096873b68f35b0d740b6574ab60b7d/app.js
    var req = ajax({
      url: 'https://api.imgur.com/3/image',
      type: 'POST',
      headers: {
        Authorization: 'Client-ID 18887b042d84001',
        Accept: 'application/json'
      },
      data: {
        image: base64,
        type: 'base64'
      }
    });

    return req.then(
      function resolve(obj) {
        //pick url from response
        self.set('controllers.predictor.imgurUrl', obj.response.data.link);
    }).catch(function(err) {
      //errors are implictly handled because the icons won't appear while the imgur url is still null (see hb template)
      console.log(err);
    });
  },

  actions: {
    /**
    Collapse/expand menu

    @method toggleMenu
    */
    toggleMenu: function() {
      this.toggleProperty('menuOpen');
    },
    /**
    Set winner predictions on, others off

    @method predictWinners
    */
    predictWinners: function() {
      this.set('controllers.predictor.predictingStandings', false);
      this.set('controllers.predictor.viewingCurrentStandings', false);
      this.toggleProperty('controllers.predictor.predictingWinners');
    },
    /**
    Set standings predictions on, others off

    @method predictStandings
    */
    predictStandings: function() {
      this.set('controllers.predictor.predictingWinners', false);
      this.set('controllers.predictor.viewingCurrentStandings', false);
      this.toggleProperty('controllers.predictor.predictingStandings');
    },
    /**
    Scroll to standings, others off

    @method currentStandings
    */
    currentStandings: function() {
      this.set('controllers.predictor.predictingWinners', false);
      this.set('controllers.predictor.predictingStandings', false);
      this.toggleProperty('controllers.predictor.viewingCurrentStandings');
    },
    /**
    Revert predictions to actual

    @method refreshStandings
    */
    refreshStandings: function() {
      this.get('controllers.predictor').send('refreshStandings');
    },

    /**
    Revert predictions to actual

    @method refreshWinners
    */
    refreshWinners: function() {
      this.get('controllers.predictor').send('refreshWinners');
    },

    /**
    Utilize html2canvas lib to convert predictor to canvas, then extract base 64

    @method takeSnapshot
    */
    takeSnapshot: function() {

      this.setProperties({
        'controllers.predictor.predictingWinners': false,
        'controllers.predictor.snapshot': true
      });

      var self = this;
      Ember.run.schedule('afterRender', function() {

        var el = Ember.$('#bracket');
        el.addClass('bracket-snapshot');
        html2canvas(el, {
          onrendered: function(canvas) {
            var $canvas = Ember.$('.canvas');

            $canvas.html(canvas).promise().done(function() {
              //base64
              var src = Ember.$('canvas')[0].toDataURL("image/png");

              self.setProperties({
                'controllers.predictor.downloadHref': src,
                'controllers.predictor.downloadFileName': self.get('year')+' NBA_Playoffs_Prediction(www.NBAplayoffs.in).png',
                'controllers.predictor.canDownload': true
              });

              //publish base64 to imgur
              self.publishToImgur(src);

            });
            el.removeClass('bracket-snapshot');
          }
        });



      });
    },

    expandStandingsSubMenu: function() {
      this.toggleProperty('standingsSubMenuOpen');
    }


  }
});
