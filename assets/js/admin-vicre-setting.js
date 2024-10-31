if( ViWre === undefined ) {
    var ViWre = {};
}
jQuery( document ).ready( function( $ ) {
    'use strict';

    ViWre.Settings = {
        init: function () {
          let self = this;
          self.loadUI();
          self.showCustomUnit( "[name=\"unit_size\"]" );
          self.showCustomUnit( "[name=\"unit_land_area\"]" );
          self.handleChangeSelectUnit( "[name=\"unit_size\"]" );
          self.handleChangeSelectUnit( "[name=\"unit_land_area\"]" );
          self.loadMapZoomSlider();
          self.handleLoadingBtn( ".vi-hui-save-settings" );
          self.handleEditor();
          self.handleSelectReCAPTCHAver();
            $( document ).on( "click", ".woore-shortcode-copy", this.handleCopy );
        },

        loadUI: function () {
            $( "#setting-menu .item" ).tab( {
                history: true,
                historyType: 'hash'
            });

            $( ".vi-hui.sortable" ).sortable({
                placeholder: "vi-hui-state-highlight",
                axis: "y",
            });

            $( ".vi-ui.dropdown" ).each( function ( idx, ele ) {
                $( ele ).dropdown();
            } );
        },

        handleSelectReCAPTCHAver: function () {
            if ( $('#woore_recaptcha_version').val() == 2 ) {
                $('.woore-recaptcha-v2-wrap').show();
                $('.woore-recaptcha-v3-wrap').hide();
            }else {
                $('.woore-recaptcha-v2-wrap').hide();
                $('.woore-recaptcha-v3-wrap').show();
            }

            $('.woore_recaptcha_version').dropdown({
                onChange: function (val) {
                    if (val == 2) {
                        $('.woore-recaptcha-v2-wrap').show();
                        $('.woore-recaptcha-v3-wrap').hide();
                    } else {
                        $('.woore-recaptcha-v2-wrap').hide();
                        $('.woore-recaptcha-v3-wrap').show();
                    }
                }
            });
        },

        handleChangeSelectUnit: function ( selector ) {
            const self = this;
            $( selector ).on( "change", function () {
                self.showCustomUnit( this );
            } );
        },

        showCustomUnit: function ( selector ) {
            let fieldIndex = $( selector ).attr( "name" );
            if ( $( selector ).val() === "cs" ) {
                $( `[data-field-index="${fieldIndex}"]` ).show();
            }else {
                $( `[data-field-index="${fieldIndex}"]` ).hide();
            }
        },

        handleLoadingBtn: function ( selector ) {
            $( selector ).on( "click", function () {
                $( this ).addClass( "loading" );
            } );
        },

        loadMapZoomSlider: function () {
            const zoomInput = $( '#slider-input-zoom-map' );
            const sliderParam = {
                min: 1,
                max: 20,
                start: zoomInput.val(),
                step:1,
                smooth:true,
                onChange: function( value ) {
                    zoomInput.val( value );
                }
            };

            $( "#slider-zoom-map" ).slider( sliderParam );
        },

        handleEditor: function () {
            const textarea = $( ".vi-hui.editor textarea" );
            const lineNumbers = $( ".vi-hui.editor .line-numbers" );

            textarea.on( "keyup", function ( e ) {
                const numberOfLines = e.target.value.split( "\n" ).length;
                textarea.css("height", numberOfLines * 10);
                lineNumbers.html( Array(numberOfLines )
                    .fill( "<span></span>" )
                    .join("") );
            } );

            textarea.on( "keydown", function ( e ) {
              if ( e.key === 'Tab' ) {
                  const start = textarea[0].selectionStart;
                  const end = textarea[0].selectionEnd;

                  textarea.val( textarea.val().substring( 0, start ) + "\t" + textarea.val().substring( end ) );
                  e.preventDefault();
              }
            } );

            textarea.trigger( "keyup" );
        },

        handleCopy() {
            let temp = $('<input>');
            $('body').append(temp);
            let $container = $(this).closest('.woore-container-input-copy');
            let copiedValue = $container.find('input').val();
            temp.val(copiedValue).select();
            document.execCommand('copy');
            temp.remove();
            $container.find('.check').show().fadeOut(10000);
        },
    };

    let mediaProperties = {
        title : VicWreSettingParams.i18n.choose_image,
        buttonText: VicWreSettingParams.i18n.select,
        multiple: false,
    }

    ViWre.Settings.init();

    ViWre.CustomMedia.loadAddImage( ".woore-marker-icon", mediaProperties );
} );