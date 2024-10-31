jQuery( document ).ready( function( $ ) {
    'use strict';


    ViWre.Map = {
        container: $( ".woore-product-page-map" ),
        vicWreMapParams: VicWreMapParams,


        init: async function () {
            this.location = this.container.find( ".woore-map-location-field" );
            this.canvas = this.container.find( ".woore-map-canvas" );
            this.inputFullAddress = $( "#_woorealestate_full_address" );
            this.inputCountry = $( "#_woorealestate_country" );
            this.inputState = $( "#_woorealestate_state" );
            this.inputCity = $( "#_woorealestate_city" );

            this.geocoder = new google.maps.Geocoder();

            await this.bindMap();
            this.mapListener();
            this.autoComplete();
        },

        bindMap: async function () {
            let locationValue = this.location.val();
            let defaultLocation = [ -33.868419, 151.193245 ];

            await this.geocoder.geocode( {"address": this.vicWreMapParams.nameCountry }, function ( results, status ) {
                if ( status === google.maps.GeocoderStatus.OK ) {
                    defaultLocation = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
                }
            } );

            locationValue = locationValue ? locationValue.split( ',' ) : defaultLocation;

            const latLng = new google.maps.LatLng( locationValue[0], locationValue[1] );
            let mapStyle = '';
            try {
                mapStyle = this.vicWreMapParams.googleMapStyle ? JSON.parse( this.vicWreMapParams.googleMapStyle ) : '';
            }catch ( err ) {
                console.log( "Map Style is invalid!" );
            }
            let configDefault = {
                center: latLng,
                zoom: this.vicWreMapParams.googleMapZoom ? parseInt( this.vicWreMapParams.googleMapZoom, 10 ) : 4,
                minZoom:4,
                maxZoom:20,
                scrollwheel: false,
                streetViewControl: 0,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.LEFT_BOTTOM
                },
            }

            this.map = new google.maps.Map( this.canvas[0], configDefault );
            this.map.setOptions( { styles: mapStyle } );
            this.marker = new google.maps.Marker( {
                position: latLng,
                map:this.map,
                draggable: true,
            } );
        },

        mapListener: function () {
            let self = this;

            // Event Click
            google.maps.event.addListener( self.map, "click", function ( event ) {
                self.marker.setPosition( event.latLng );
                self.location.val( event.latLng.lat() + ',' + event.latLng.lng() );

                self.geocoder.geocode( { 'location': event.latLng }, function ( results, status ) {
                    if ( status === google.maps.GeocoderStatus.OK ) {
                        self.handleAddress( results[0].address_components );
                        self.inputFullAddress.val( results[0].formatted_address );
                    }
                } );
            } );

            // Event Drag
            google.maps.event.addListener( self.marker, "drag", function ( event ) {
                self.location.val( event.latLng.lat() + ',' + event.latLng.lng() );

                self.geocoder.geocode( {'location': event.latLng }, function ( results, status ) {
                    if ( status === google.maps.GeocoderStatus.OK ) {
                        self.handleAddress( results[0].address_components );
                        self.inputFullAddress.val( results[0].formatted_address );
                    }
                } );
            } );
        },


        autoComplete: function () {
            let self = this;

            self.inputFullAddress.autocomplete( {
                source: function ( request, response ) {
                    self.geocoder.geocode( {
                        'address': request.term,
                    }, function ( results ) {
                        response($.map( results, function ( item ) {
                         return {
                             label: item.formatted_address,
                             value: item.formatted_address,
                             latitude: item.geometry.location.lat(),
                             longitude: item.geometry.location.lng()
                         }
                        }));
                    } );
                },

                select: function ( event, ui ) {
                    let latLng = new google.maps.LatLng( ui.item.latitude, ui.item.longitude );
                    self.map.setCenter( latLng );
                    self.marker.setPosition( latLng );
                    self.location.val( ui.item.latitude + ',' + ui.item.longitude );

                    self.geocoder.geocode( {'location': latLng }, function ( results, status ) {
                        if ( status === google.maps.GeocoderStatus.OK ) {
                            self.handleAddress( results[0].address_components );
                            self.inputFullAddress.val( results[0].formatted_address );
                        }
                    } );
                }
            } );
        },

        handleAddress( address_components ) {
            const self = this;

            let country = "",
                state = "",
                city = "";
            address_components.forEach( function ( ele ) {
                let countryCheck = ele.types.indexOf( "country" );
                let stateCheck = ele.types.indexOf( "administrative_area_level_1" );
                if ( -1 !== countryCheck ) {
                    country = ele.short_name;
                }
                if ( -1 !== stateCheck ) {
                    state = ele.long_name;
                }
                if ( ( -1 !== ele.types.indexOf( "locality" ) ) || ( -1 !== ele.types.indexOf( "administrative_area_level_2" ) ) ) {
                    city = ele.long_name;
                }
            } );

            if ( self.inputCountry.length > 0 ) {
                self.inputCountry.val( country ).trigger("change");
            }

            if ( self.inputState.length > 0 ) {
                self.inputState.val( state );
            }
            if ( self.inputCity.length > 0 ) {
                self.inputCity.val( city );
            }

        },
    };

} );