jQuery( document ).ready( function ( $ ) {
    'use strict';

    const ajaxUrl = VicWreSearchParams.ajaxUrl;
    const nonce = VicWreSearchParams.nonce;
    const oldValue = {};
    function loadLayout( key ) {
        wp.customize( `woorealestate_params[${key}]`, function (value ) {
            value.bind( function ( newval ) {
                oldValue[key] = newval;
                $.ajax( {
                    type: 'POST',
                    dataType: 'json',
                    url : ajaxUrl,
                    data: {
                        action: "woore_real_estate_page_layout",
                        nonce : nonce,
                        new_val: JSON.stringify( { [key]: newval } ),
                        old_val: JSON.stringify( oldValue ),
                    },
                    beforeSend: function (  ) {
                        handleOverlayProcessing( "show" );
                    },
                    success: function ( res ) {
                        if ( res.formSearch ) {
                            $( ".woore-real-estate-search-page" ).html( res.formSearch );
                        }
                    },
                    error: function ( err ) {
                        console.log( err );
                    },
                    complete: function () {
                        handleOverlayProcessing( "hide" );
                    }
                } );
            } );
        } );
    }
    function handleOverlayProcessing( action ) {
        wp.customize.preview.send( "woores_handle_overlay_processing", action );
        if ( action === "show" ){
            $( ".woore-real-estate-search-preview-processing-overlay" ).show();
        }else {
            $( ".woore-real-estate-search-preview-processing-overlay" ).hide();
        }
    }

    function addPreviewControl(names, element, style, suffix = [], media= [] ) {
        if ( names.length > 0 && Array.isArray( names ) ) {
            names.forEach( function ( name, idx ) {
                wp.customize('woorealestate_params[' + name + ']', function (value) {
                    value.bind(function (newval) {

                        let arrCss = isNaN( newval ) ? newval.split( "_" ) : '',
                            cssValue = "";
                        if ( arrCss.length > 0 && Array.isArray (arrCss ) ) {
                            arrCss.forEach( function ( ele ) {
                                cssValue += " " + ele + suffix[idx];
                            } );
                        }else {
                            switch ( newval ) {
                                case '':
                                    cssValue = 'none';
                                    break;
                                case 'auto':
                                    cssValue = 'auto';
                                    break;
                                default:
                                    cssValue = newval + suffix[idx];
                            }
                        }

                        let media_start = '';
                        let media_end = '';
                        if ( media.length > 0 ) {

                            media_end = media[idx].length === 0 ? '' : '}'
                            switch ( media[idx] ) {
                                case 'mobile':
                                    media_start = '@media screen and (max-width: 320px) {';
                                    break;
                                case 'tablet':
                                    media_start = '@media screen and (min-width: 321px) and (max-width: 720px) {';
                                    break;
                                case 'desktop':
                                    media_start = '@media screen and (min-width: 721px) {';
                                    break;
                                default:
                            }
                        }
                        $('#woore-real-estate-search-preview-' + name.replace(/_/g, '-') + '-inline-css').html( media_start + element + '{' + style[idx] + ':' + cssValue + '}' + media_end );
                    } );
                } );
            } );
        }
    }

    /*General Section*/
    addPreviewControl( ["label_fields"], ".woore-real-estate-search-page .vi-hui-form .vi-hui-field label, .woore-real-estate-search-page .vi-hui-form .woore_form_search_fields label", ["display"], [""] );
    addPreviewControl(
        ["input_size"],
        ".woore-real-estate-search-page .vi-hui-form input[type=text],.woore-real-estate-search-page .vi-hui-form select, .woore-real-estate-search-page .vi-hui-form input[type=number]",
        ["padding"],
        ["px"] );

    addPreviewControl( ["button_size"], ".woore-real-estate-search-page .vi-hui-form .vi-hui-button", ["padding"], ["px"] );

    wp.customize('woorealestate_params[select2_size]', function (value) {
        value.bind(function (newval) {
            $( ".woore-real-estate-search-page .select2-container .select2-selection--single" ).css({"height": newval + "px"});
            $( ".woore-real-estate-search-page .select2-container--default .select2-selection--single .select2-selection__rendered" ).css({"line-height": newval + "px"});
            $( ".woore-real-estate-search-page .select2-container--default .select2-selection--single .select2-selection__arrow" ).css({"height": newval + "px"});
        });
    });

    /*Input Search*/
    addPreviewControl(
        [ "input_search_col_width_desktop", "input_search_col_width_tablet", "input_search_col_width_mobile" ],
        '.woore-real-estate-search-page #woore-real-estate-search-input_search',
        ["width", "width", "width"],
        ["%", "%", "%"],
        [ "desktop", "tablet", "mobile" ]
    );

    addPreviewControl(
        [ "input_search_hide_on_desktop", "input_search_hide_on_tablet", "input_search_hide_on_mobile" ],
        '.woore-real-estate-search-page #woore-real-estate-search-input_search',
        ["display", "display", "display"],
        ["","",""],
        [ "desktop", "tablet", "mobile" ]
    );

    /*Button Search*/
    addPreviewControl(
        [ "button_search_text_size" ],
        '.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text',
        [ "font-size" ],
        [ "px" ],
    );

    addPreviewControl(
        [ "button_search_icon_size" ],
        '.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .dashicons',
        [ "font-size" ],
        [ "px" ],
    );

    addPreviewControl(
        [ "button_search_color" ],
        '.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .dashicons, .woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button .woore-real-estate-search-button_search_text',
        [ "color" ],
        [ "" ],
    );

    addPreviewControl(
        [ "button_search_background", "button_search_border_width", "button_search_border_style", "button_search_border_color" ],
        '.woore-real-estate-search-page #woore-real-estate-search-button_search .vi-hui-button',
        [ "background", "border-width", "border-style", "border-color" ],
        [ "", "px", "", "" ],
    );

    /*Price Search*/

    addPreviewControl(
        [ "price_search_hide_on_desktop", "price_search_hide_on_tablet", "price_search_hide_on_mobile" ],
        '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-price_search',
        ["display", "display", "display"],
        ["","",""],
        [ "desktop", "tablet", "mobile" ]
    );

    addPreviewControl(
        [ "price_search_col_width_desktop", "price_search_col_width_tablet", "price_search_col_width_mobile" ],
        '.woore-real-estate-search-page #woore-real-estate-search-input-price_search',
        ["width", "width", "width"],
        ["%", "%", "%"],
        [ "desktop", "tablet", "mobile" ]
    );

    /*Size Search*/

    addPreviewControl(
        [ "size_search_hide_on_desktop", "size_search_hide_on_tablet", "size_search_hide_on_mobile" ],
        '.woore-real-estate-search-page #woore_search_form .woore-real-estate-search-size_search',
        ["display", "display", "display"],
        ["","",""],
        [ "desktop", "tablet", "mobile" ]
    );

    addPreviewControl(
        [ "size_search_col_width_desktop", "size_search_col_width_tablet", "size_search_col_width_mobile" ],
        '.woore-real-estate-search-page #woore-real-estate-search-input-size_search',
        ["width", "width", "width"],
        ["%", "%", "%"],
        [ "desktop", "tablet", "mobile" ]
    );

    loadLayout( "fields" );
    loadLayout( "button_search_type" );

    function setLabelAndPlaceholder( key, typeEle = "input", lang = {} ) {
        let labelKey = lang.hasOwnProperty('label') ? `woorealestate_params[${key}_label][${VicWreSearchParams.language}]` : `woorealestate_params[${key}_label]`;
        wp.customize( labelKey, function ( value ) {
            value.bind( function ( newval ) {
                $( `#woore-real-estate-search-${key} > label` ).text( newval );
            } );
        } );

        let placeholderKey = lang.hasOwnProperty('placeholder') ? `woorealestate_params[${key}_place_holder][${VicWreSearchParams.language}]` : `woorealestate_params[${key}_place_holder]`;
        wp.customize( placeholderKey, function ( value ) {
            value.bind( function ( newval ) {
                if ( typeEle === "input" ) {
                    $( `#woore-real-estate-search-${key} input` ).attr( "placeholder", newval );
                }else {
                    $( `#woore-real-estate-search-${key} select option:eq(0)` ).text( newval );
                    $( `#select2-woore_form_search_${key}-container` ).text( newval );
                }
            } );
        } );
    }

    setLabelAndPlaceholder( "input_search", "input", {label: true, placeholder: true} );

    wp.customize( `woorealestate_params[button_search_text]`, function ( value ) {
        value.bind( function ( newval ) {
            let btnLabel = $( `#woore-real-estate-search-button_search .woore-real-estate-search-button_search_text` );
            if( btnLabel.length > 0 ) {
                btnLabel.text( newval );
            }
        } );
    } );

    wp.customize.preview.bind('active', function () {
        $( "body" ).on( "click", ".woore-real-estate-search-edit-item-shortcut", function () {
            $( "body" ).find( ".woore-real-estate-search-editing" ).removeClass( "woore-real-estate-search-editing" );
            $(this).parent().addClass( "woore-real-estate-search-editing" );
            wp.customize.preview.send('woores_shortcut_edit', $(this).data()["edit_section"]);
        } );
    } );

    wp.customize.preview.bind( "woores_shortcut_edit_item_from_section", function ( item ) {
        $('.' + item).click();
    });

    wp.customize.preview.bind( "woores_remove_state_editing", function ( val ) {
        $( "body" ).find( ".woore-real-estate-search-editing" ).removeClass( "woore-real-estate-search-editing" );
    } );


} );