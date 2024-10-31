if( ViWre === undefined ) {
    var ViWre = {};
}

jQuery( document ).ready( function ( $ ) {
    'use strict';
    $( "#sub-accordion-section-woore_search_customizer_general" ).append( '<li class="woore-real-estate-search-control-processing"></li>' );
    $( "#sub-accordion-section-woore_search_customizer_button_search" ).append( '<li class="woore-real-estate-search-control-processing"></li>' );
    $( "#sub-accordion-section-woore_search_customizer_price_search" ).append( '<li class="woore-real-estate-search-control-processing"></li>' );

    ViWre.CustomControlBlock = {
        init() {
            this.prefix = "woore-real-estate-search-";
            this.containerForm = $( `.${this.prefix}container` );


            this.containerForm.on( "mousedown", this.formClick.bind( this ) );
            $( `#${this.prefix}container-banner-search` ).sortable({
                items: ".woore-real-estate-search-item",
                placeholder: "woore-real-estate-search-place-holder",
                axis: "y",
                stop: function ( event, ui ) {
                    let newFields = {
                        banner_search: [],
                    };

                    $( "#woore-real-estate-search-container-banner-search .woore-real-estate-search-item" ).each( function (){
                        newFields.banner_search.push( [$( this ).data( "block_item" ), $( this ).hasClass( "woore-real-estate-search-item__active" ) ? 'on': ''] );
                    } );
                    wp.customize( "woorealestate_params[fields]" ).set( JSON.stringify( newFields ) );
                }
            } ).disableSelection();
        },

        formClick( e ) {
            let ele_selected  = e.target;

            let typeBlock = $( ele_selected ).parent().data( "block_item" ),
                oldFields = JSON.parse( wp.customize( "woorealestate_params[fields]" ).get() ),
                index = $( ele_selected ).parent().index() -1;

            switch ( ele_selected.classList[0] ) {
                case "dashicons-visibility":
                    $( ele_selected ).parent().removeClass( "woore-real-estate-search-item__active" );
                    if ( oldFields.banner_search[index] && oldFields.banner_search[index][0] === typeBlock ) {
                        oldFields.banner_search[index][1] = '';
                    }
                    wp.customize( "woorealestate_params[fields]" ).set( JSON.stringify( oldFields ) );
                    break;
                case "dashicons-hidden":

                    $( ele_selected ).parent().addClass( "woore-real-estate-search-item__active" );
                    if ( oldFields.banner_search[index] && oldFields.banner_search[index][0] === typeBlock ) {
                        oldFields.banner_search[index][1] = 'on';
                    }
                    wp.customize( "woorealestate_params[fields]" ).set( JSON.stringify( oldFields ) );
                    break;
                default:
            }

        },
    };

    ViWre.CustomControlBlock.init();

} );