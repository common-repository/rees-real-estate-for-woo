<?php defined( 'ABSPATH' ) || exit; ?>
<div class="woore-single-property-area">
    <p class="woore-single-property-area-header"><?php esc_html_e( 'Contact', 'rees-real-estate-for-woo' ) ?></p>

    <div class="woore-contact">
        <div class="woore-contact-agent">
            <div class="woore-contact-agent-avatar">
                <img src="<?php echo esc_url( $user_avatar_url ); ?>" alt="">
            </div>
            <div class="woore-contact-agent-content">
                <p class="woore-contact-agent-heading"><?php echo esc_html( $user_display_name ); ?></p>
                <div class="woore-contact-agent-social">
                    <?php foreach ( $social_links as $key => $social_link ) : ?>
                        <?php if ( ! empty( $social_link ) ) : ?>
                            <a href="<?php echo esc_url( $social_link ); ?>"
                               title="<?php esc_attr( strtoupper( $key )  ); ?>">
                                <i class="icon <?php echo esc_attr( 'icon-woore-brand-' . $key ) ?>"></i>
                            </a>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
                <div class="woore-contact-agent-info-contact">
					<?php
					if ( ! empty( $woore_info_mobile ) ) :
						?>
                        <div>
                            <span class="dashicons dashicons-phone"></span>
                            <span><?php echo esc_html( $woore_info_mobile ); ?></span>
                        </div>
					<?php
					endif;

					if ( ! empty( $user_email ) ) :
						?>
                        <div>
                            <span class="dashicons dashicons-email-alt"></span>
                            <span><?php echo esc_html( $user_email ); ?></span>
                        </div>
					<?php
					endif;

					if ( ! empty( $user_url ) ) :
						?>
                        <div class="woore-contact-agent-url">
                            <span class="dashicons dashicons-admin-links"></span>
                            <a href="<?php echo esc_url( $user_url ); ?>"><?php echo esc_html( $user_url ); ?></a>
                        </div>
					<?php
					endif;
					?>
                </div>
            </div>
        </div>

        <div class="clear">
            <form class="woore-contact-form" action="#" method="POST" id="woore-contact-agent-form">
                <input type="hidden" name="woore_target_email" value="<?php echo esc_attr( $user_email ); ?>">
                <input type="hidden" name="woore_property_url" value="<?php echo esc_attr( $property_url ); ?>">
                <div class="woore-contact-form-fields">
                    <div class="vi-hui input">
                        <input type="text" placeholder="<?php esc_attr_e( 'Full Name', 'rees-real-estate-for-woo' ) ?>"
                               name="woore_sender_name">
                        <span class="vi-hui-msg"></span>
                    </div>

                    <div class="vi-hui input">
                        <input type="text" placeholder="<?php esc_attr_e( 'Phone Number', 'rees-real-estate-for-woo' ) ?>"
                               name="woore_sender_phone">
                        <span class="vi-hui-msg"></span>
                    </div>

                    <div class="vi-hui input">
                        <input type="text" placeholder="<?php esc_attr_e( 'Email Address', 'rees-real-estate-for-woo' ) ?>"
                               name="woore_sender_email">
                        <span class="vi-hui-msg"></span>
                    </div>

                    <div class="vi-hui input">
                    <textarea name="woore_sender_msg" id="" cols="30"
                              rows="4"><?php echo esc_html__( "Hello, I am interested in ", 'rees-real-estate-for-woo' ) . esc_html( "'$property_name'" ); ?></textarea>
                        <span class="vi-hui-msg"></span>
                    </div>
                </div>

				<?php
				if ( $woore_recaptcha ) {
					?>
                    <div class="woore-recaptcha-field">
                        <div class="woore-recaptcha"></div>
                        <input type="hidden" value="" class="woore-g-validate-response">
                    </div>
					<?php
				}
				?>

                <button class="vi-hui vi-hui-button primary" type="submit">
					<?php esc_html_e( 'Submit', 'rees-real-estate-for-woo' ) ?>
                </button>
                <div class="woore-contact-form-msg"></div>
            </form>

        </div>
    </div>
</div>
<div class="vi-hui vi-hui-modal" id="woore-contact-notify">
    <div class="vi-hui-overlay"></div>
    <div class="modal-content">
        <i class="icon icon-woore-close"></i>
        <div class="vi-hui-modal-body">
            <div class="woore-contact-notify-container">

            </div>
        </div>
    </div>
</div>