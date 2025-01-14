(function ($) {
    'use strict';

    ViWre.CustomMedia = {

        loadAddImage: function ( selector,  mediaProperties = {}) {
            let self = this;
            if( $( selector ).length > 0 ) {

                $( selector ).each( function ( index, ele ) {
                    let mediaUploader = self.createMedia( mediaProperties.title, mediaProperties.buttonText, mediaProperties.multiple );
                    self.handleEventSelectImageMedia( ele, mediaUploader );
                    self.handleRemoveImageMedia( ele );
                    self.openMedia( ele, mediaUploader );
                } );

            }
        },

        openMedia: function ( selector, mediaUploader ) {

            let triggerButton = $( selector ).last();
            $( triggerButton ).on( "click", function ( e ) {
                e.preventDefault();
                mediaUploader.open();
            });
        },

        handleEventSelectImageMedia: function ( selector , mediaUploader ) {

            let triggerButton = $( selector ).last();
            mediaUploader.on( "select", function (){

                let attachment = mediaUploader.state().get( "selection" ).first().toJSON();

                if ( 0 > attachment.url.trim().length ) {
                    return;
                }

                let eleImage = triggerButton.children( "img" );
                let eleInput = triggerButton.children( "input" );
                triggerButton.addClass( "remove" );

                eleImage.attr( "src", attachment.url );
                eleImage.attr( "alt", attachment.alt );
                eleInput.val( attachment.id );
            } );

        },

        handleRemoveImageMedia: function ( selector ) {

            $( selector ).children( "span" ).on( "click", function ( e ) {
                e.preventDefault();
                e.stopPropagation();
                $( selector ).removeClass( "remove" );
                $( selector ).children( "input" ).val( "" );
                $( selector ).children( "img" ).attr( "src", "" );
            } );

        },

        createMedia: function ( title = "Choose Image", buttonText = "Select", multiple = false ) {
            return wp.media( {
                title,
                button: {
                    text: buttonText
                },
                multiple,
            } );
        },
    };
})(jQuery);

