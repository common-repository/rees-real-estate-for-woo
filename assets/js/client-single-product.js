if ( ViWre === undefined ) {
    var ViWre = {};
}

let reesYotubeApiTag = document.createElement('script');

reesYotubeApiTag.src = "https://www.youtube.com/iframe_api";
let reesFirstScriptTag = document.getElementsByTagName('script')[0];
reesFirstScriptTag.parentNode.insertBefore(reesYotubeApiTag, reesFirstScriptTag);

var ViWrePlayer;

//https://developers.google.com/youtube/iframe_api_reference
function onYouTubeIframeAPIReady() {
    'use strict';

    if ( document.querySelector("#woore-video-iframe") ) {
        let src = document.querySelector("#woore-video-iframe").dataset.src;
        if ( -1 !== src.indexOf( "www.youtube.com" ) ) {
            ViWrePlayer = new YT.Player( 'woore-video-iframe', {
                height: '360',
                width: '640',
                videoId: src.split('/').pop(),
            } );
        }
    }

}

// https://developers.google.com/recaptcha/intro
if ( VicWreParams.enableCaptcha ) {
    if ( VicWreParams.captchaSiteKey ) {

        let script = document.createElement('script');

        if ( VicWreParams.recaptchaVersion === '2' ) {
            script.defer = true;
            script.async = true;
        }
        script.src = VicWreParams.recaptchaSrc;
        document.head.appendChild( script );

        function woore_validateRecaptcha(response) {
            if (response) {
                document.querySelector('.woore-recaptcha-field .woore-g-validate-response').value = response;
            }
        }
        var woore_reCaptchaV2Onload = function () {
            grecaptcha.render(document.querySelector(".woore-recaptcha"), {
                'sitekey': VicWreParams.captchaSiteKey,

                'callback': woore_validateRecaptcha,

                'expired-callback': function () {
                    document.querySelector('.woore-recaptcha-field .woore-g-validate-response').value = null;
                },

                'theme': VicWreParams.recaptchaSecretTheme,

                'isolated': false
            });
        }

        function woore_reCaptchaV3Onload() {
            if (typeof grecaptcha !== 'undefined') {
                grecaptcha.ready(function () {
                    grecaptcha.execute( VicWreParams.captchaSiteKey, {action: 'homepage'}).then(function (token) {
                        woore_validateRecaptcha(token);
                    })
                });
            }
        }

        window.addEventListener('load', function () {
            if ( VicWreParams.recaptchaVersion === '3' ) {
                woore_reCaptchaV3Onload();
            }
        });


    }
}


jQuery( document ).ready( function ( $ ) {
    'use strict';

    ViWre.SingleProductPage = {
        vicWreParams: VicWreParams,
        requestsDirection: {},
        directionsService: new google.maps.DirectionsService(),
        zoomScale: 1,


        init: function () {
            const self = this;

            self.mapStyle = '';
            try {
                self.mapStyle = self.vicWreParams.googleMapStyle ? JSON.parse( self.vicWreParams.googleMapStyle ) : '';
            }catch ( err ) {
                console.log( "Map Style is invalid!" );
            }

            self.handleOverviewComponent();
            self.handleModalMap( "#open-map", "#woore-map-modal" );
            self.handledModalFloor( ".woore-outer-floor-img" );
            self.handledModalFloor( ".woore-outer-floor-desktop-item" );
            self.showOuterImageFloor();
            self.handledZoomFloorImage();
            self.printFile();
            self.initMap();
            self.handleTravelTime();
            self.initDirection();
            self.handleNearbyPlaces();
            self.loadDataNearbyPlaces( self.showDataNearbyPlaces );
            self.handleEventKeyEscForModal();
            self.handleEventClickVideoImage();
            self.handleImagePanorama();
            self.handleContactAgent();
        },

        handleContactAgent: function () {
            const self = this,
                  contactForm = $( "#woore-contact-agent-form" ),
                  modal = $( "#woore-contact-notify" );

            modal.on( "click", ".modal-content > i.icon-woore-close,.vi-hui-overlay", function () {
                modal.hide();
                $( document.body ).css( {'overflow': 'auto'} );
            } );
            const showContactPopup = ({title = '', message = '', buttonText = '', type = 'success'}) => {
                const main = $( ".woore-contact-notify-container" );

                if ( main.get(0) ) {
                    if ( 'loader' === type ) {
                        main.html( `
                            <div class="woore-contact-loader-container">
                                <div class="woore-contact-loader"></div>
                                <span>${message}</span>
                            </div>` );
                    }else {
                        const popup = $( "<div></div>");
                        popup.addClass( `woore-contact-notify-wrap ${type}` );

                        const icons = {
                            success: 'icon icon-woore-check',
                            error: 'icon icon-woore-close',
                        };

                        const icon = icons[type];
                        popup.html(
                            `<div class="woore-contact-notify-icon">
                                <i class="${icon}"></i>
                            </div>
                            <div class="woore-contact-notify-info">
                                <p>${title}</p>
                                <span>${message}</span>
                            </div>
                            <div class="woore-contact-notify-button">
                                <div class="vi-hui vi-hui-button primary">
                                    ${buttonText}
                                </div>
                            </div>`
                        );
                        popup.find( ".vi-hui-button" ).on( "click", function () {
                            modal.hide();
                            $( document.body ).css( {'overflow': 'auto'} );
                        } );
                        main.html( popup );
                    }

                    modal.show();
                    $( document.body ).css( {'overflow': 'hidden'} );
                }
            };

            contactForm.on( "submit", function (e) {
                e.preventDefault();

                let data = {
                    action: 'woore_contact_agent_ajax',
                    nonce: VicWreParams.nonce,
                },
                formData = $( this ).serializeArray(),
                checkResults = [],
                check = true;

                formData.forEach( function ( item ) {
                    checkResults.push( self.validateContactForm( item.name, item.value ) );
                    data[item.name] = item.value;
                } );

                check = checkResults.every( function ( value ) {
                    return value === true;
                } );

                if ( ! check ) return;

                $.ajax({
                    url: VicWreParams.ajaxUrl,
                    type: 'post',
                    dataType: 'json',
                    data: data,
                    async: true,
                    beforeSend: function () {
                        showContactPopup({
                            title: '',
                            message: VicWreParams.i18n.please_wait,
                            buttonText: '',
                            type: 'loader',
                        });
                    },
                    success: function ( res ) {
                        if ( res ) {
                            if ( res.success ) {
                                showContactPopup({
                                    title: VicWreParams.i18n.success,
                                    message: res.data,
                                    buttonText: VicWreParams.i18n.continue_text,
                                } );
                            }else {
                                showContactPopup({
                                    title: VicWreParams.i18n.error,
                                    message: res.data,
                                    buttonText: VicWreParams.i18n.try_again,
                                    type: "error"
                                } );
                            }
                            console.log( res.data );
                        }
                    },
                    error: function ( res ) {
                        if ( res ) {
                            console.log( res.data );
                            showContactPopup({
                                title: VicWreParams.i18n.error,
                                message: res.data,
                                buttonText: VicWreParams.i18n.try_again,
                                type: "error"
                            } );
                        }
                    },
                    complete: function () {}
                });

            } );

            contactForm.on( "focus", "input, textarea", function () {
                $( this ).parent().removeClass( "error" );
            } );
        },

        validateContactForm: function ( name, value ) {
            const patternEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let rule = {
                woore_sender_name: ["required"],
                woore_sender_phone: ["required"],
                woore_sender_email: ["required", "email"],
                woore_sender_msg: ["required"],
            };

            let messageArr = {
                woore_sender_name: [VicWreParams.i18n.enter_fullname],
                woore_sender_phone: [VicWreParams.i18n.enter_phone],
                woore_sender_email: [ VicWreParams.i18n.enter_email, VicWreParams.i18n.email_not_valid],
                woore_sender_msg: [VicWreParams.i18n.enter_message],
            }

            let isCheck = true,
                message = '';

            if ( rule[name] ) {
                rule[name].forEach( function ( ruleName, index ) {
                    if ( isCheck=== false ) return;
                    switch ( ruleName ) {
                        case 'required': isCheck = ! value.trim().length <= 0;
                            break;
                        case 'email': isCheck = patternEmail.test( value );
                            break;
                    }
                    message = messageArr[name][index];
                } );
            }

            if ( ! isCheck ) {
                let parent = $( `[name="${name}"]` ).parent();
                parent.addClass( "error" );
                parent.find( ".vi-hui-msg" ).text( message );

                return false;
            }

            return  true;

        },

        handleImagePanorama: function () {
            const panorama = $( "#woore-panorama" ).get( 0 );
            if ( panorama ) {
                let data = {
                    action: 'woore_get_tour',
                    post_id: VicWreParams.post_id,
                    nonce: VicWreParams.nonce,
                }

                $.ajax({
                    url: VicWreParams.ajaxUrl,
                    type: 'get',
                    dataType: 'json',
                    data: data,
                    async: false,
                    beforeSend: function (  ) {
                    },
                    success: function ( res ) {
                        let value = JSON.parse( res );
                        if ( Object.keys( value.scenes ).length > 0 ) {
                            pannellum.viewer("woore-panorama", value );
                        }else {
                            $( panorama ).closest( ".woore-single-property-area" ).css( "display", "none" );
                        }
                    },
                    error: function ( res ) {
                        if ( res ) {
                            console.log( res.data );
                            $( panorama ).closest( ".woore-single-property-area" ).css( "display", "none" );
                        }
                    },
                    complete: function () {
                    }
                });
            }
        },

        handleEventClickVideoImage: function () {
            let imgVideo = $( ".woore-video-poster-image" );
            let videoType = $( ".woore-video" ).data( "type" );
            let source = '';

            let myIframe = $( "#woore-video-iframe" );
            if ( myIframe.length > 0 ) {
                source = myIframe.data( "src" );
            }

            if ( 'link' === videoType ) {

                if ( -1 !== source.indexOf( "player.vimeo.com" ) ) {
                    let option = {
                        url: source,
                    }
                    ViWrePlayer = new Vimeo.Player( 'woore-video-iframe', option );
                }

            }

            if ( imgVideo.length > 0 ) {
                imgVideo.on( "click", function () {
                    imgVideo.hide();
                    if ( 'link' === videoType ) {
                        if ( ViWrePlayer !== undefined ) {
                            if ( -1 !== source.indexOf( "player.vimeo.com" ) ) {
                                ViWrePlayer.play();
                            }
                            if ( -1 !== source.indexOf( "www.youtube.com" ) ) {
                                ViWrePlayer.playVideo();
                            }
                        }
                    }else {
                        let video = $( ".woore-wp-video-shortcode" )[0];
                        video.play();
                    }
                } );
            }
        },

        handleOverviewComponent: function () {
            let overviewItems = $( ".woore-overview-item" );
            let flagClass = true;
            for ( let i = 0; i < overviewItems.length; i+=2 ) {

                let rowClass = flagClass === true ? 'row-odd' : 'row-even';
                overviewItems[i].classList.add(rowClass);

                if ( (i+1) < overviewItems.length ) {
                    overviewItems[i+1].classList.add(rowClass);
                }

                flagClass = !flagClass;

            }
        },


        handleModalMap: function ( eleOpen, modal ) {
            const self = this;
            let mapCanvas =  $( "#woore-map-canvas" );
            if ( mapCanvas.length > 0 ) {
                let locationValue = mapCanvas.data( "location" ).split(",");
                const latLng = new google.maps.LatLng( locationValue[0], locationValue[1] );

                const modalMap = $( "#woore-modal-map-canvas" );
                const map = new google.maps.Map( modalMap[0], {
                    center: latLng,
                    zoom: self.vicWreParams.googleMapZoom ? parseInt( self.vicWreParams.googleMapZoom, 10 ) : 15,
                    styles: self.mapStyle,
                    streetViewControl: false,
                    disableDefaultUI:true,
                    fullscreenControl: true,
                    zoomControl:true,
                    rotateControl: true,
                } );

                let panorama = new google.maps.StreetViewPanorama( modalMap[0], {
                    position: latLng,
                    pov: {heading: 165, pitch: 0},
                    zoom: self.vicWreParams.googleMapZoom ? parseInt( self.vicWreParams.googleMapZoom, 10 ) : 15,
                } );

                const markerMap = new google.maps.Marker({
                    position: latLng,
                    map,
                    clickable: false
                });

                const markerPano = new google.maps.Marker({
                    position: latLng,
                    map: panorama,
                    clickable: false
                });

                map.setStreetView(panorama);
                markerMap.setIcon( self.vicWreParams.mapMarkerIcon );
                markerPano.setIcon( self.vicWreParams.mapMarkerIcon );
                panorama.setVisible(false);


                $( eleOpen ).on( "click", function ( event ) {
                    event.preventDefault();
                    modal = $( modal );
                    if ( modal.length > 0 ) {
                        self.handleModalMapButton( map, panorama );
                        modal.show();

                        $( document.body ).css( {"overflow": "hidden"} );

                        modal.on( "click", function ( e ) {
                            if (
                                e.target.closest( ".icon.icon-woore-close" ) ||
                                e.target.closest( ".vi-hui-overlay" )
                            ) {
                                $( this ).hide();
                                $( document.body ).css( {"overflow": "auto"} );
                            }

                        } );
                    }
                } );
            }
        },

        handleModalMapButton: function ( map, panorama ) {
            const btnAction = $( ".woore-modal-map-btn" );
            btnAction.each( function ( i, ele ) {
                $( ele ).on( "click", function ( event ) {
                    event.preventDefault();
                    const action = $( this ).data( "action" );
                    const activeBtn = $( ".woore-modal-map-btn.active" );
                    activeBtn.removeClass( "active" );
                    $( this ).addClass( "active" );
                    switch ( action ) {
                        case 'satellite':
                            map.setMapTypeId('satellite');
                            panorama.setVisible(false);
                            break
                        case 'streetView':
                            panorama.setVisible(true);
                            break;
                        default:
                            panorama.setVisible(false);
                            map.setMapTypeId('roadmap');
                    }
                } );
            } );
        },

        handledModalFloor: function ( selector ) {
            let self = this;

            $( selector ).on( "click", function ( event ) {
                event.preventDefault();
                let index = $( this ).data("index");
                $( ".woore-floor-plans-item.active" ).removeClass( "active" );
                $( `.woore-floor-plans-item[data-index="${index}"]`).addClass( "active" );

                let modal = $( "#vi-hui-floor-modal" );
                modal.show();

                $( document.body ).css( {"overflow": "hidden"} );

                modal.on( "click", function ( e ) {
                    let modalContent = this.lastElementChild;

                    if (
                        e.target.closest( ".icon.icon-woore-close" ) ||
                        ( e.target.closest( ".modal-content" ) !== modalContent )
                    ) {

                        $( this ).hide();
                        $( document.body ).css( {"overflow": "auto"} )

                      // Set default coordinates
                        let zooms = $( ".woore-floor-plans-img img" );
                        self.zoomScale = 1;
                        self.changeStatusZoomBtn( self.zoomScale );
                        zooms.each( function ( idx, ele ) {
                            self.huiSetTransform( ele, 0, 0, 1 );
                        } );
                    }

                } );
            } );
        },


        showOuterImageFloor: function () {
            $( ".woore-outer-floor-box" ).each( function ( idx, ele ) {
                $( ele ).on( "click", function () {
                    if ( $( ele ). hasClass( "active" ) ) {
                        $( ele ).removeClass( "active" );
                        $( ele ).next().css("max-height", 0);
                    }else {
                        let activeEle = $( ".woore-outer-floor-box.active" );
                        activeEle.removeClass( "active" );
                        activeEle.next().css("max-height", 0);

                        $( ele ).addClass( "active" );
                        $( ele ).next().css("max-height", 350 + "px");
                    }
                } );
            } );
        },

        handledZoomFloorImage: function () {
            let self = this,
                panning = false,
                pointX = 0,
                pointY = 0,
                start = { x: 0, y: 0},
                zooms = $( ".woore-floor-plans-img img" );

            zooms.each( function ( idx, ele ) {
                let zoom = $( ele );

                const eleWidth = ele.width;
                const eleHeight = ele.height;
                const scaleFactor = 3;
                let scopeTranslate = {
                    x: eleWidth - (eleWidth * ( scaleFactor / 100 )),
                    y: eleHeight - (eleHeight * ( scaleFactor / 100 )),
                };


                zoom.on( "mousedown", function ( e ) {
                    e.preventDefault();
                    start = { x: e.clientX - pointX, y: e.clientY - pointY };
                    panning = true;
                } );

                zoom.on( "mouseup", function () {
                    panning = false;
                } );

                zoom.on( "mousemove", function ( e ) {
                    e.preventDefault();
                    if ( ! panning ) {
                        return;
                    }
                    pointX = ( e.clientX - start.x );
                    pointY = ( e.clientY - start.y );

                    let percent = scaleFactor / self.zoomScale;
                    scopeTranslate = {
                        x: eleWidth - (eleWidth * ( percent / 100 )),
                        y: eleHeight - (eleHeight * ( percent / 100 )),
                    };

                    let point = self.updateTranslate( scopeTranslate, pointX, pointY );
                    pointX = point.x;
                    pointY = point.y;
                    self.huiSetTransform( zoom, pointX, pointY, self.zoomScale );
                } );

                zoom.on( "mouseout", function () {
                    panning = false;
                }) ;


                zoom.on( "dblclick", function ( e ) {
                    e.preventDefault();
                    self.zoomScale += 1;
                    self.zoomScale = self.checkScale( self.zoomScale );
                    self.changeStatusZoomBtn( self.zoomScale );

                    self.huiSetTransform( zoom, pointX, pointY, self.zoomScale );
                } );

                zoom.on( "contextmenu", function ( e ) {
                    e.preventDefault();
                    self.zoomScale -= 1;
                    self.zoomScale = self.checkScale( self.zoomScale );
                    self.changeStatusZoomBtn( self.zoomScale );

                    self.huiSetTransform( zoom, pointX, pointY, self.zoomScale );
                } );

            } );

            $( "[data-zoom-button]" ).each( function ( idx, ele ) {
                $( ele ).on( "click", function ( e )    {
                    e.preventDefault();
                    const zoom = $( ".woore-floor-plans-item.active" ).find( ".woore-floor-plans-img img" );
                    const delta = $( ele ).data( "zoomButton" ) === "in" ? 1 : -1;
                    (delta > 0) ? ( self.zoomScale += 1 ) : ( self.zoomScale -= 1 );
                    self.zoomScale = self.checkScale( self.zoomScale );

                    self.changeStatusZoomBtn( self.zoomScale );

                    self.huiSetTransform( zoom, pointX, pointY, self.zoomScale  );

                } );
            } );

        },

        updateTranslate: function ( scopeTranslate, pointX, pointY ) {
            return {
                x: Math.min( Math.max( -scopeTranslate.x, pointX ), scopeTranslate.x ),
                y: Math.min( Math.max( -scopeTranslate.y, pointY ), scopeTranslate.y ),
            }
        },

        huiSetTransform: function ( zoom, pointX, pointY, scale ) {
            $( zoom ).css( "transform", "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")");
        },

        checkScale: function ( scale, minScale = 1, maxScale = 4 ) {
            return Math.min ( Math.max( minScale, scale ), maxScale );
        },

        changeStatusZoomBtn: function ( scale, minScale = 1, maxScale = 4 ) {

            let zoomIn = $( "[data-zoom-button = \"in\"]" );
            let zoomOut = $( "[data-zoom-button = \"out\"]" );
            if ( scale === maxScale ) {
                zoomIn.attr( "disabled", "disabled" );
                zoomOut.prop("disabled", false);
            }

            if ( scale === minScale ) {
                zoomOut.attr( "disabled", "disabled" );
                zoomIn.prop("disabled", false);
            }

            if ( scale > minScale && scale < maxScale ) {
                $( "[data-zoom-button][disabled= \"disabled\"]" ).prop("disabled", false);
            }
        },

        printFile: function () {
            $( ".file-action-item.print" ).each( function ( index, ele ) {
                $( ele ).on( 'click', function ( e ) {
                    window.open( $( this ).data('url') ).print();
                } );
            } );
        },

        initMap: function () {
            const self = this;
            let mapDiv = $( "#woore-map-canvas" );
            if ( mapDiv.length > 0 ) {
                let locationValue = mapDiv.data( "location" ).split(",");
                const latLng = new google.maps.LatLng( locationValue[0], locationValue[1] );

                const map = new google.maps.Map( mapDiv[0], {
                    center: latLng,
                    zoom: self.vicWreParams.googleMapZoom ? parseInt( self.vicWreParams.googleMapZoom, 10 ) : 15,
                    disableDefaultUI:true,
                    fullscreenControl: false,
                    keyboardShortcuts: false,
                    gestureHandling: "none",
                } );

                map.setOptions( { styles: self.mapStyle } );

                const marker = new google.maps.Marker({
                    position: latLng,
                    map,
                    clickable: false
                });
                marker.setIcon( self.vicWreParams.mapMarkerIcon );
            }

        },

        handleTravelTime: function () {
            const self = this;
            self.handleWreTab( '#woore-travel-tab', '.woore-travel-table', self.switchTabAndFindRoute );

            let travelTime = $( ".woore-travel-time" );
            let travelTitle = $( "#woore-travel-title" );

            travelTitle.on( "click", function () {
                this.lastElementChild.classList.toggle( 'active' );
                travelTime.slideToggle();
            } );

        },

        handleWreTab: function ( tabSelector, tabTableSelector, callback ) {
            const self = this;
            let isRTL = $(document.body).hasClass( "rtl" );
            $( tabSelector ).on( "click", function ( e ) {
                e.preventDefault();
                const currentActiveTab = $( this ).children( ".active" );
                let selectedEle = e.target;

                if ( selectedEle !== this && selectedEle !== currentActiveTab[0] ){

                    let lastEle = this.lastElementChild;
                    let width = selectedEle.offsetWidth;
                    let left = ( $( this ).innerWidth() - $(this).width() ) / 2;
                    let children = this.children;
                    let lengthChild = children.length;
                    let index = $( e.target ).index();

                    for ( let i = 0; i < index; i++ ) {
                        left += children[ i ].offsetWidth;
                    }

                    for (let i = 0; i < lengthChild; i++) {
                        if ( children[ i ] !== selectedEle ) {
                            children[ i ].classList.remove( "active" );
                        }
                    }
                    if ( isRTL ) {
                        $( lastEle ).animate( {
                            right: left,
                            width,
                        }, 200 );
                    }else {
                        $( lastEle ).animate( {
                            left,
                            width,
                        }, 200 );
                    }


                    selectedEle.classList.add( "active" );
                    let dataTaget = $(selectedEle).data("target").slice(1);
                    $( `${tabTableSelector}.active`).removeClass( "active" );
                    $(`[aria-labelledby ="${dataTaget}-tab"]`).addClass( "active" );
                    if ( typeof callback === 'function' ) {
                        callback( selectedEle, self );
                    }
                }

            } );

            const tabsBox = $( tabSelector );
            let btnTab = $( tabSelector ).parent().find( ".woore-tab-btn" );

            if ( btnTab.length < 2 ) {
                return;
            }

            let isDragging = false;
            const handleBtnTab =  () => {
                let scrollVal = Math.round( tabsBox[0].scrollLeft );
                let maxScrollableWidth = tabsBox[0].scrollWidth - tabsBox[0].clientWidth;

                $( btnTab[0] ).css( "display", scrollVal > 0 ? "flex" : "none" );
                $( btnTab[1] ).css( "display", ( maxScrollableWidth - 1 ) > scrollVal ? "flex" : "none" );
            }

            handleBtnTab();

            $( window ).on( "resize", function() {
                handleBtnTab();
            });

            btnTab.on( "click", function() {
                let id = $( this ).attr( "id" );
                let scrollLeft = tabsBox.scrollLeft();
                tabsBox.scrollLeft(  scrollLeft + ( id === "woore-left" ? -350 : 350 ) );

                setTimeout( () => {
                    handleBtnTab();
                }, 50 );
            });


            const dragging = ( e ) => {
                if ( !isDragging)  return;
                tabsBox.addClass( "dragging" );
                let scrollLeft = tabsBox.scrollLeft();
                tabsBox.scrollLeft( scrollLeft - e.originalEvent.movementX );
                handleBtnTab();
            };

            const dragStop = () => {
                isDragging = false;
                tabsBox.removeClass( "dragging" );
            }

            tabsBox.on( "mousedown", () => { isDragging = true } );
            tabsBox.on( "mousemove", dragging );
            tabsBox.on( "mouseup", dragStop );
            tabsBox.on( "mouseleave", dragStop );

        },

        switchTabAndFindRoute: function ( selectedEle, self ) {
            let dataTaget = $(selectedEle).data("target").slice(1);
            $('.woore-travel-table.active').removeClass( "active" );
            $(`[aria-labelledby ="${dataTaget}-tab"]`).addClass( "active" );
            $( "#woore-direction-btn" ).data( "tab", dataTaget );

            if ( JSON.stringify( self.requestsDirection ) !== '{}' ) {
                self.requestsDirection.travelMode = dataTaget.toUpperCase();
                self.calculateAndDisplayRoute( self.requestsDirection );
            }

        },

        initDirection: function () {
            const self = this;
            const inputDestination = $( "#woore-destination-input" ),
                inputOrigin = $( "#woore-origin-input" ),
                btnDirection = $( "#woore-direction-btn" );
            if ( inputDestination.length > 0 ) {
                const autocompleteOption = {
                    fields: ["formatted_address", "geometry", "name"],
                    strictBounds: false,
                    types: ['address'],
                    componentRestrictions: {country: self.vicWreParams.country },
                };

                const autocomplete = new google.maps.places.Autocomplete( inputDestination[0], autocompleteOption );
                inputDestination.on( "input", function () {
                    if ( $.trim( this.value ) !== "" ) {
                        btnDirection.prop( "disabled", false );
                    }else {
                        btnDirection.prop( "disabled", true );
                    }
                } );

                btnDirection.on( "click", function ( e ) {
                    e.preventDefault();
                    let locationValue = inputOrigin.val().split(","),
                        valueTravelMode = btnDirection.data( "tab" ).toUpperCase(),
                        valueDestination = inputDestination.val();
                    const latLng = new google.maps.LatLng( locationValue[0], locationValue[1] );

                    self.requestsDirection = {
                        origin: latLng,
                        destination: valueDestination,
                        travelMode: valueTravelMode,
                        unitSystem: self.vicWreParams.mapUnitSystem === 'metric' ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL,
                    };

                    self.calculateAndDisplayRoute( self.requestsDirection );
                    inputDestination.val("");
                    btnDirection.prop( "disabled", true );
                } );
            }
        },

        calculateAndDisplayRoute: function ( request ) {
            const self = this;
            self.directionsService.route( request, function ( response, status ) {
              let result = {};
              if ( status === google.maps.DirectionsStatus.OK ) {

                  result = {
                      name: response.request.destination.query,
                      duration: response.routes[0].legs[0].duration.text,
                      distance: response.routes[0].legs[0].distance.text,
                      status: "OK",
                  }

              } else {
                  result = {
                      name: response.request.destination.query,
                      status: "ZERO_RESULTS",
                  }
              }
              self.createTravelRow( result );
              
            } );
        },

        createTravelRow: function ( result ) {
            const activeTab = $( ".woore-travel-table.active" );
            activeTab.html("");
            let divEle = document.createElement( "div" );
            let travelResult = `<div class="woore-travel-result">
                    <p>${result.duration}</p>
                    <p>${result.distance}</p>
                </div>`;

            divEle.classList.add( "woore-travel-row" );

            if ( result.status !== "OK" ) {
                travelResult = `<div class="woore-travel-result">
                    <p>${this.vicWreParams.i18n.not_found}</p>
                </div>`;
            }

            divEle.innerHTML = `<div class="woore-travel-input">
                    <p>${result.name}</p>
                </div>

                ${travelResult}`;

            activeTab.append( divEle );
        },

        handleEventKeyEscForModal: function () {
            $( document ).on( "keyup", function( event ) {
                if ( event.keyCode === 27 ) {
                    $( ".vi-hui.vi-hui-modal" ).each( function ( i, ele ) {
                        $( ele ).hide();
                        $( document.body ).css( { "overflow": "auto" } );
                    } );
                }
            } );
        },

        handleNearbyPlaces:function () {
            const self = this;
            let tabSelector = '#woore-nearby-place-tab';
            if ( $( tabSelector ).length > 0 ) {
                self.handleWreTab( tabSelector, '.woore-nearby-places-table', '' );

                let activeEleWidth = $( tabSelector ).find( '.active' )[0].offsetWidth;
                $( tabSelector ).find( 'span:last-child' ).width( activeEleWidth );
            }
        },

        loadDataNearbyPlaces: function ( callback ) {
            const divEle = $( ".woore-places" );
            if ( divEle.length > 0 ) {
                let locationValue = divEle.data( "location" ).split(",");
                const latLng = new google.maps.LatLng( locationValue[0], locationValue[1] );
                const service = new google.maps.places.PlacesService( document.createElement( "div" ) );
                let type = this.vicWreParams.nearbyPlacesTypes;
                let rankBy = ( this.vicWreParams.rankBy === 'prominence' ) ? google.maps.places.RankBy.PROMINENCE : google.maps.places.RankBy.DISTANCE;
                let unitDistance = this.vicWreParams.nearbyPlacesUnit;
                let placesSearchRequestParams = {
                    location: latLng,
                    rankBy,
                }

                if ( google.maps.places.RankBy.PROMINENCE === rankBy ) {
                    placesSearchRequestParams.radius = 3000;
                }

                const data = [];
                $.each( type, function () {
                    let _type = this;
                    placesSearchRequestParams.type = _type;

                    service.nearbySearch( placesSearchRequestParams,  function ( results, status ) {
                        if ( status === google.maps.places.PlacesServiceStatus.OK ) {
                            for ( let i = 0; i < results.length; i++) {
                                let place = results[i];
                                service.getDetails({ placeId: place.place_id }, function ( placeDetails, status ) {
                                    if ( status === google.maps.places.PlacesServiceStatus.OK ) {

                                        let distance = google.maps.geometry.spherical.computeDistanceBetween(
                                            latLng,
                                            placeDetails.geometry.location,
                                        );

                                        distance = ( ( unitDistance === 'mi' ) ? (distance / 1609.34): (distance / 1000) ).toFixed( 2 );

                                        let item = {
                                            name: placeDetails.name,
                                            vicinity: placeDetails.vicinity,
                                            types: placeDetails.types,
                                            website: placeDetails.website,
                                            rating: placeDetails.rating,
                                            user_ratings_total: placeDetails.user_ratings_total,
                                            distance: distance + unitDistance,
                                        };
                                        data.push( item );
                                        callback( data, _type );
                                    }
                                });
                            }
                        }
                    } );
                } );

            }

        },

        showDataNearbyPlaces: function ( data, type ) {
            let html = [];
            data.forEach( function ( ele ) {
                if ( ele.types.includes( type ) ) {

                    let innerHtml = `<div class="woore-nearby-places-primary">
                                <span class="woore-nearby-places-name">${ele.name}</span>
                                <div class="woore-nearby-places-basic-info">
                                    <span class="woore-nearby-places-text">${ele.vicinity}</span>
                                    <span class="woore-nearby-places-text"> ${ typeof ele.rating === 'undefined' ? 0 : ele.rating}&#9734;( ${ typeof ele.user_ratings_total === 'undefined' ? 0 : ele.user_ratings_total} )</span>
                                </div>
                            </div>
                    
                            <span class="woore-nearby-places-distance">${ele.distance}</span>`;
                    if ( typeof ele.website === "undefined" ) {
                        html.push( `<div class="woore-nearby-places-item">${innerHtml}</div>` );
                    }else {
                        html.push( `<a href="${ele.website}" target="_blank" class="woore-nearby-places-item">${innerHtml}</a>` );
                    }
                }
            } );

            if ( html.length > 0 ) {
                $(`.woore-nearby-places-table[aria-labelledby ="${type}-tab"]`).html( html.join('') );
            }
        },
    }

    ViWre.SingleProductPage.init();
} );
