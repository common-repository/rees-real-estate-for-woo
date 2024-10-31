if( ViWre === undefined ) {
    var ViWre = {};
}
jQuery( document ).ready( function ( $ ) {
    'use strict';

    ViWre.ShortcodeFormSearchInit = {
        init() {
            $( '.woore_form_search_select' ).each( function () {
                $( this ).select2( {
                    width: '100%',
                } );
            } );
        },
    }

} );