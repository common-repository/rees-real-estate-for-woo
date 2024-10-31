<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap">
    <h1><?php esc_html_e( 'Real Estate for WooCommerce Settings', 'rees-real-estate-for-woo' ); ?></h1>

    <form action="" class="vi-ui form" method="post">
		<?php wp_nonce_field( 'wrealestate_nonce', '_rees_setting_nonce' ) ?>
        <div class="vi-ui top attached tabular menu" id="setting-menu">
            <a class="item active" data-tab="general"><?php esc_html_e( 'General', 'rees-real-estate-for-woo' ); ?></a>
            <a class="item" data-tab="search"><?php esc_html_e( 'Search', 'rees-real-estate-for-woo' ); ?></a>
            <a class="item" data-tab="google-map"><?php esc_html_e( 'Google Map', 'rees-real-estate-for-woo' ); ?></a>
            <a class="item"
               data-tab="nearby-places"><?php esc_html_e( 'Nearby Places', 'rees-real-estate-for-woo' ); ?></a>
            <a class="item" data-tab="calculation"><?php esc_html_e( 'Calculation', 'rees-real-estate-for-woo' ); ?></a>
            <a class="item"
               data-tab="google-recaptcha"><?php esc_html_e( 'Google reCAPTCHA', 'rees-real-estate-for-woo' ); ?></a>
        </div>

        <div class="vi-ui bottom attached tab segment active" data-tab="general">
            <table class="form-table">
                <tbody>
                <tr>
                    <th>
						<?php esc_html_e( 'Measurement units for Property Size', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <select name="rees_unit_size"
                                class="vi-ui fluid dropdown">
							<?php
							foreach ( $unit_default as $key => $value ) {
								?>
                                <option value="<?php echo esc_attr( $key ); ?>" <?php selected( $unit_size, $key ); ?>>
									<?php echo esc_html( $value ); ?>
                                </option>
								<?php
							}
							?>
                        </select>
                        <p><?php esc_html_e( 'Choose Measurement units for Property Size', 'rees-real-estate-for-woo' ); ?></p>
                    </td>
                </tr>
                <tr data-field-index="rees_unit_size">
                    <th></th>
                    <td>
                        <div>
                            <input type="text" name="rees_custom_unit_size"
                                   placeholder="<?php esc_attr_e( 'Enter Custom Unit', 'rees-real-estate-for-woo' ); ?>"
                                   value="<?php echo esc_attr( $custom_unit_size ) ?>">
                        </div>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Measurement units for Land Area', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <select name="rees_unit_land_area"
                                class="vi-ui fluid dropdown">
							<?php
							foreach ( $unit_default as $key => $value ) {
								?>
                                <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $unit_land_area, $key ); ?>>
									<?php echo esc_html( $value ); ?>
                                </option>
								<?php
							}
							?>
                        </select>
                        <p><?php esc_html_e( 'Choose Measurement units for Land Area', 'rees-real-estate-for-woo' ); ?></p>
                    </td>
                </tr>

                <tr data-field-index="rees_unit_land_area">
                    <th></th>
                    <td>
                        <div>
                            <input type="text"
                                   name="rees_custom_unit_land_area"
                                   placeholder="<?php esc_attr_e( 'Enter Custom Unit', 'rees-real-estate-for-woo' ); ?>"
                                   value="<?php echo esc_attr( $custom_unit_land_area ) ?>">
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Style for File Attachement', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <select name="rees_style_file_attachment"
                                class="vi-ui fluid dropdown">
							<?php
							foreach ( $style_file_attachment_default as $key => $value ) {
								?>
                                <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $style_file_attachment, $key ); ?>>
									<?php echo esc_html( $value ); ?>
                                </option>
								<?php
							}
							?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Component position on single product page', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <select name="rees_property_components"
                                class="vi-ui fluid dropdown">
							<?php
							foreach ( $component_product_default as $key => $value ) {
								?>
                                <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $property_components, $key ); ?>>
									<?php echo esc_html( $value ); ?>
                                </option>
								<?php
							}
							?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( "Order of components", 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <ul class="vi-hui sortable">
							<?php foreach ( $order_of_components as $component ) { ?>
                                <li>
                                    <input type="hidden"
                                           name="rees_order_of_components[<?php echo esc_attr( $component ); ?>]"
                                           value="<?php echo esc_attr( $component ); ?>">
                                    <span>&#9776;</span><?php echo esc_html( $order_of_components_default[ $component ] ); ?>
                                </li>
							<?php } ?>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Admin Contact', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
						<?php
						$users = get_users( array(
							'role'   => 'Administrator',
							'fields' => array( 'ID', 'user_nicename' )
						) );
						?>
                        <select name="rees_admin_contact"
                                class="vi-ui fluid dropdown">
							<?php
							foreach ( $users as $key => $value ) {
								?>
                                <option value="<?php echo esc_attr( $value->ID ) ?>" <?php selected( $admin_contact, $value->ID ); ?>>
									<?php echo esc_html( $value->user_nicename ); ?>
                                </option>
								<?php
							}
							?>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Shortcode Search', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <div class="vi-ui action input woore-container-input-copy">
                            <input type="text" readonly
                                   value="[woore_form_search]">
                            <i class="check icon"></i>
                            <button type="button" class="vi-ui teal right labeled icon button woore-shortcode-copy">
                                <i class="copy icon"></i>
								<?php esc_html_e( 'Copy', 'rees-real-estate-for-woo' ); ?>
                            </button>
                        </div>
                        <p><?php esc_html_e( "If shortcode is duplicated, please use this shortcode to remove the duplicated shortcode:", 'rees-real-estate-for-woo' ); ?>
                            <b><?php echo esc_html( '[woore_form_search remove_duplicates="true"]' ) ?></b></p>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
        <div class="vi-ui bottom attached tab segment" data-tab="search">
            <table class="form-table">
                <tr>
                    <th><?php esc_html_e( 'Search Result Page', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div class="vi-ui fluid search selection dropdown">
                            <input type="hidden" name="rees_search_result_page"
                                   value="<?php echo esc_attr( $search_result_page ); ?>">
                            <i class="dropdown icon"></i>
                            <div class="default text"><?php esc_html_e( 'Select Result Page', 'rees-real-estate-for-woo' ); ?></div>
                            <div class="menu">
								<?php
								$rees_woo_pages = array(
									wc_get_page_id( 'cart' ),
									wc_get_page_id( 'checkout' ),
									wc_get_page_id( 'myaccount' ),
									wc_get_page_id( 'shop' ),
								);
								$rees_pages    = get_pages();
								?>
								<?php foreach ( $rees_pages as $rees_page ) : ?>
                                    <?php if ( ! in_array( $rees_page->ID, $rees_woo_pages, true) ) : ?>
                                    <div class="item <?php echo esc_attr( $search_result_page == $rees_page->ID ? 'active selected' : '' ); ?>"
                                         data-value="<?php echo esc_attr( $rees_page->ID ); ?>">
										<?php
										// translators: %1$s is a placeholder for post's title, %2$s is a placeholder for post's ID.
										printf( esc_html__( '%1$s (ID: %2$s)', 'rees-real-estate-for-woo' ), esc_html( $rees_page->post_title ), esc_html( $rees_page->ID ), ); ?>
                                    </div>
                                    <?php endif; ?>
								<?php endforeach; ?>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Design', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <a href="<?php echo esc_url( admin_url( 'customize.php' ) . '?url=' . rawurlencode( get_permalink( $search_result_page ) ) . '&autofocus[panel]=woocommerce_real_estate_search' ); ?>"
                           class="vi-ui button teal" target="_blank">
							<?php esc_html_e( 'Go to search design page', 'rees-real-estate-for-woo' ); ?>
                        </a>
                    </td>
                </tr>
            </table>
        </div>
        <div class="vi-ui bottom attached tab segment" data-tab="google-map">
            <table class="form-table">
                <tr>
                    <th><?php esc_html_e( 'Google Maps API KEY', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
                            <input type="text"
                                   name="rees_google_map_api_key"
                                   value="<?php echo esc_attr( $google_map_api_key ); ?>">
                        </div>
                        <p>
							<?php esc_html_e( 'We strongly encourage you to get an APIs Console key. You can get it from', 'rees-real-estate-for-woo' ); ?>
                            <a href="https://console.cloud.google.com/apis/credentials"
                               target="_blank"><?php esc_html_e( 'here', 'rees-real-estate-for-woo' ); ?></a>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Default Map Zoom', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div class="vi-ui labeled slider blue large" id="slider-zoom-map"></div>
                        <input type="hidden" id="slider-input-zoom-map"
                               name="rees_map_zoom"
                               value="<?php echo esc_attr( $map_zoom ); ?>">
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Style for Google Map', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <div class="vi-hui editor">
                            <div class="line-numbers">
                                <span></span>
                            </div>
                            <textarea name="rees_google_map_style"
                                      spellcheck="false"><?php echo esc_html( wp_unslash( $google_map_style ) ); ?></textarea>
                        </div>
                        <p>
							<?php esc_html_e( 'Use', 'rees-real-estate-for-woo' ); ?> <a href="https://snazzymaps.com/"
                                                                                         target="_blank">https://snazzymaps.com/</a> <?php esc_html_e( 'to create styles', 'rees-real-estate-for-woo' ); ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Map Marker Icon', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
                            <a href="#"
                               class="woore-marker-icon woore-custom-media <?php echo esc_attr( ! empty( $map_marker_icon ) ? 'remove' : '' ); ?>">
								<?php echo ! empty( wp_get_attachment_image( $map_marker_icon, 'full' ) ) ? wp_get_attachment_image( esc_attr( $map_marker_icon ), 'full' ) : '<img src="' . esc_attr( $map_marker_icon ) . '" alt="">'; ?>
                                <input type="hidden"
                                       name="rees_map_marker_icon"
                                       value="<?php echo ! empty( $map_marker_icon ) ? esc_attr( $map_marker_icon ) : ''; ?>">
                                <span></span>
                            </a>
                            <p>
								<?php esc_html_e( "Please choose the appropriate size for your icon (The default icon's current size is 52x70)", 'rees-real-estate-for-woo' ); ?>
                            </p>
                        </div>
                    </td>
                </tr>

                <tr>
                    <th><?php esc_html_e( 'Enable Travel Time', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div class="vi-ui toggle checkbox">
                            <input type="checkbox"
                                   name="rees_enable_travel_time"
                                   value="yes" <?php checked( ! empty( $enable_travel_time ) ); ?>>
                            <label></label>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Distance Units', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <select name="rees_map_unit_system"
                                class="vi-ui fluid dropdown">
							<?php foreach ( $unit_system_default as $key => $value ) { ?>
                                <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $map_unit_system, $key ); ?>>
									<?php echo esc_html( $value ); ?>
                                </option>
							<?php } ?>
                    </td>
                </tr>
            </table>
        </div>
        <div class="vi-ui bottom attached tab segment" data-tab="nearby-places">
            <table class="form-table">
                <tr>
                    <th><?php esc_html_e( "Enable Nearby Places", 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div class="vi-ui toggle checkbox">
                            <input type="checkbox"
                                   name="rees_enable_nearby_places"
                                   value="yes" <?php checked( ! empty( $enable_nearby_places ) ) ?>>
                            <label><?php esc_html_e( 'Enable Nearby Places on single property page?', 'rees-real-estate-for-woo' ); ?></label>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( "Rank by", 'rees-real-estate-for-woo' ); ?></th>
                    <td>
						<?php if ( ! empty( $nearby_places_rank_by_default ) ) : ?>
                            <select name="rees_rank_by"
                                    class="vi-ui fluid dropdown">
								<?php foreach ( $nearby_places_rank_by_default as $key => $value ) { ?>
                                    <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $rank_by, $key ); ?>>
										<?php echo esc_html( $value ); ?>
                                    </option>
								<?php } ?>
                            </select>
						<?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( "Nearby places distance in", 'rees-real-estate-for-woo' ); ?></th>
                    <td>
						<?php if ( ! empty( $nearby_places_unit_default ) ) : ?>
                            <select name="rees_unit_distance"
                                    class="vi-ui fluid dropdown">
								<?php foreach ( $nearby_places_unit_default as $key => $value ) { ?>
                                    <option value="<?php echo esc_attr( $key ) ?>" <?php selected( $unit_distance, $key ); ?>>
										<?php echo esc_html( $value ); ?>
                                    </option>
								<?php } ?>
                            </select>
						<?php endif; ?>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( "Nearby Places Field", 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
							<?php $nearby_places_field = empty( $nearby_places_field ) ? array() : $nearby_places_field; ?>
							<?php if ( ! empty( $nearby_places_type_default ) ) : ?>
                                <select class="vi-ui fluid search dropdown"
                                        name="rees_nearby_places_field[]"
                                        multiple="">
									<?php foreach ( $nearby_places_type_default as $key => $value ) { ?>
                                        <option value="<?php echo esc_attr( $key ); ?>" <?php selected( in_array( $key, $nearby_places_field, true ) ); ?>><?php echo esc_html( $value ); ?></option>
									<?php } ?>
                                </select>
							<?php endif; ?>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <div class="vi-ui bottom attached tab segment" data-tab="calculation">
            <table class="form-table">
                <tr>
                    <th><?php esc_html_e( 'Mortgage calculator', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div class="vi-ui toggle checkbox">
                            <input type="checkbox"
                                   name="rees_mortgage_calculator"
                                   value="yes" <?php checked( ! empty( $mortgage_calculator ) ); ?>>
                            <label></label>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Interest rate', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
                            <input type="number" min="0.01" max="35" step="0.01"
                                   name="rees_interest_rate"
                                   value="<?php echo esc_attr( $interest_rate ); ?>">
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Number of Repayment year', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
                            <input type="number" min="1" max="35" step="1"
                                   name="rees_repayment_year"
                                   value="<?php echo esc_attr( $repayment_year ); ?>">
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Shortcode ', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <div>
                            <div class="vi-ui action input woore-container-input-copy">
                                <input type="text" readonly
                                       value="[woore_mortgage_calculator]">
                                <i class="check icon"></i>
                                <button type="button" class="vi-ui teal right labeled icon button woore-shortcode-copy">
                                    <i class="copy icon"></i>
									<?php esc_html_e( 'Copy', 'rees-real-estate-for-woo' ); ?>
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <div class="vi-ui bottom attached tab segment" data-tab="google-recaptcha">
            <table class="form-table">
                <tr>
                    <th>
						<?php esc_html_e( 'Enable', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <div class="vi-ui toggle checkbox">
                            <input type="checkbox"
                                   name="rees_enable_google_recaptcha"
                                   value="yes" <?php checked( ! empty( $enable_google_recaptcha ) ); ?>>
                            <label><?php esc_html_e( 'Enable to use reCAPTCHA in the Contact form when users contact the property admin', 'rees-real-estate-for-woo' ); ?></label>
                        </div>
                    </td>
                </tr>
                <tr>
                    <th><?php esc_html_e( 'Version', 'rees-real-estate-for-woo' ); ?></th>
                    <td>
                        <select name="rees_recaptcha_version"
                                class="vi-ui fluid dropdown woore_recaptcha_version"
                                id="woore_recaptcha_version">
                            <option value="2" <?php selected( $recaptcha_version, '2' ) ?>><?php esc_html_e( 'reCAPTCHA v2', 'rees-real-estate-for-woo' ) ?></option>
                            <option value="3" <?php selected( $recaptcha_version, '3' ) ?>><?php esc_html_e( 'reCAPTCHA v3', 'rees-real-estate-for-woo' ) ?></option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Site Key', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <div>
                            <input type="text" name="rees_site_key"
                                   value="<?php echo esc_attr( $site_key ) ?>">
                        </div>
                    </td>
                </tr>
                <tr>
                    <th>
						<?php esc_html_e( 'Secret Key', 'rees-real-estate-for-woo' ); ?>
                    </th>
                    <td>
                        <div>
                            <input type="text" name="rees_secret_key"
                                   value="<?php echo esc_attr( $secret_key ) ?>">
                        </div>
                    </td>
                </tr>
                <tr class="woore-recaptcha-v2-wrap">
                    <th>
                        <label for="woore_recaptcha_secret_theme"><?php esc_html_e( 'Theme', 'rees-real-estate-for-woo' ) ?></label>
                    </th>
                    <td>
                        <select name="rees_recaptcha_secret_theme"
                                id="woore_recaptcha_secret_theme"
                                class="vi-ui fluid dropdown woore_recaptcha_secret_theme">
                            <option value="dark" <?php selected( $recaptcha_secret_theme, 'dark' ) ?>><?php esc_html_e( 'Dark', 'rees-real-estate-for-woo' ) ?></option>
                            <option value="light" <?php selected( $recaptcha_secret_theme, 'light' ) ?>><?php esc_html_e( 'Light', 'rees-real-estate-for-woo' ) ?></option>
                        </select>
                    </td>
                </tr>
                <tr valign="top">
                    <th>
                        <label for=""><?php esc_html_e( 'Guide', 'rees-real-estate-for-woo' ) ?></label>
                    </th>
                    <td>
                        <div>
                            <strong class="woore-recaptcha-v2-wrap">
								<?php esc_html_e( 'Get Google reCAPTCHA V2 Site and Secret key', 'rees-real-estate-for-woo' ) ?>
                            </strong>
                            <strong class="woore-recaptcha-v3-wrap">
								<?php esc_html_e( 'Get Google reCAPTCHA V3 Site and Secret key', 'rees-real-estate-for-woo' ) ?>
                            </strong>
                            <ul>
                                <li><?php echo wp_kses_post( __( '1, Visit <a target="_blank" href="http://www.google.com/recaptcha/admin">page</a> to sign up for an API key pair with your Gmail account', 'rees-real-estate-for-woo' ) ); ?></li>

                                <li class="woore-recaptcha-v2-wrap">
									<?php esc_html_e( '2, Choose reCAPTCHA v2 checkbox ', 'rees-real-estate-for-woo' ) ?>
                                </li>
                                <li class="woore-recaptcha-v3-wrap">
									<?php esc_html_e( '2, Choose reCAPTCHA v3', 'rees-real-estate-for-woo' ) ?>
                                </li>
                                <li><?php esc_html_e( '3, Fill in authorized domains', 'rees-real-estate-for-woo' ) ?></li>
                                <li><?php esc_html_e( '4, Accept terms of service and click Register button', 'rees-real-estate-for-woo' ) ?></li>
                                <li><?php esc_html_e( '5, Copy and paste the site and secret key into the above field', 'rees-real-estate-for-woo' ) ?></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <div class="vi-hui save-settings-container">
            <button type="submit" class="vi-ui button icon labeled primary vi-hui-save-settings">
                <i class="icon save"></i>
				<?php esc_html_e( 'Save Settings', 'rees-real-estate-for-woo' ); ?>
            </button>
        </div>
    </form>
</div>