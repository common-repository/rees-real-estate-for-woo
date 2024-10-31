<?php

namespace REES\Inc;

defined( 'ABSPATH' ) || exit;

class REES_Admin_Profile {

	protected static $instance = null;

	private function __construct() {
		add_action( 'show_user_profile', array( $this, 'add_admin_meta_fields' ) );
		add_action( 'personal_options_update', array( $this, 'save_admin_meta_fields' ) );
	}

	public static function instance() {
		return null === self::$instance ? self::$instance = new self() : self::$instance;
	}

	function get_admin_meta_fields() {
		return array(
			'woore_info'   => array(
				'title'  => esc_html__( 'Profile Info', 'rees-real-estate-for-woo' ),
				'fields' => array(
					'woore_info_mobile'     => array(
						'label'       => esc_html__( 'Mobile', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_info_fax_number' => array(
						'label'       => esc_html__( 'Fax Number', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_info_skype'      => array(
						'label'       => esc_html__( 'Skype', 'rees-real-estate-for-woo' ),
						'description' => '',
					)
				)
			),
			'woore_social' => array(
				'title'  => esc_html__( 'Social Profiles', 'rees-real-estate-for-woo' ),
				'fields' => array(
					'woore_social_facebook'  => array(
						'label'       => esc_html__( 'Facebook', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_twitter'   => array(
						'label'       => esc_html__( 'X', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_linkedin'  => array(
						'label'       => esc_html__( 'LinkedIn', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_pinterest' => array(
						'label'       => esc_html__( 'Pinterest', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_instagram' => array(
						'label'       => esc_html__( 'Instagram', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_youtube'   => array(
						'label'       => esc_html__( 'Youtube', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
					'woore_social_vimeo'     => array(
						'label'       => esc_html__( 'Vimeo', 'rees-real-estate-for-woo' ),
						'description' => '',
					),
				)
			)
		);
	}

	function add_admin_meta_fields( $user ) {
		if ( ! current_user_can( 'edit_user', $user->ID ) ) {
			return;
		}

		$show_fields = $this->get_admin_meta_fields();

		foreach ( $show_fields as $fieldset_key => $fieldset ) :
			?>
            <h2><?php echo esc_html( $fieldset['title'] ); ?></h2>
            <table class="form-table" id="<?php echo esc_attr( 'fieldset-' . $fieldset_key ); ?>">
				<?php foreach ( $fieldset['fields'] as $key => $field ) : ?>
                    <tr>
                        <th>
                            <label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $field['label'] ); ?></label>
                        </th>
                        <td>
							<?php if ( ! empty( $field['type'] ) && 'select' === $field['type'] ) : ?>
                                <select name="<?php echo esc_attr( $key ); ?>" id="<?php echo esc_attr( $key ); ?>"
                                        class="<?php echo esc_attr( $field['class'] ); ?>" style="width: 25em;">
									<?php
									$selected = esc_attr( get_user_meta( $user->ID, $key, true ) );
									foreach ( $field['options'] as $option_key => $option_value ) :
										?>
                                        <option value="<?php echo esc_attr( $option_key ); ?>" <?php selected( $selected, $option_key, true ); ?>><?php echo esc_html( $option_value ); ?></option>
									<?php endforeach; ?>
                                </select>
							<?php elseif ( ! empty( $field['type'] ) && 'checkbox' === $field['type'] ) : ?>
                                <input type="checkbox" name="<?php echo esc_attr( $key ); ?>"
                                       id="<?php echo esc_attr( $key ); ?>" value="1"
                                       class="<?php echo esc_attr( $field['class'] ); ?>" <?php checked( (int) get_user_meta( $user->ID, $key, true ), 1, true ); ?> />
							<?php elseif ( ! empty( $field['type'] ) && 'button' === $field['type'] ) : ?>
                                <button type="button" id="<?php echo esc_attr( $key ); ?>"
                                        class="button <?php echo esc_attr( $field['class'] ); ?>"><?php echo esc_html( $field['text'] ); ?></button>
							<?php else : ?>
                                <input type="text" name="<?php echo esc_attr( $key ); ?>"
                                       id="<?php echo esc_attr( $key ); ?>"
                                       value="<?php echo esc_attr( get_user_meta( $user->ID, $key, true ) ); ?>"
                                       class="<?php echo( ! empty( $field['class'] ) ? esc_attr( $field['class'] ) : 'regular-text' ); ?>"/>
							<?php endif; ?>
                            <p class="description"><?php echo wp_kses_post( $field['description'] ); ?></p>
                        </td>
                    </tr>
				<?php endforeach; ?>
            </table>
		<?php
		endforeach;
	}

	public function save_admin_meta_fields( $user_id ) {
		check_admin_referer( 'update-user_' . $user_id );

		if ( ! current_user_can( 'edit_user', $user_id ) ) {
			wp_die( esc_html__( 'Sorry, you are not allowed to edit this user.', 'rees-real-estate-for-woo' ) );
		}

		$save_fields = $this->get_admin_meta_fields();

		foreach ( $save_fields as $fieldset ) {

			foreach ( $fieldset['fields'] as $key => $field ) {
				if ( isset( $field['type'] ) && 'checkbox' === $field['type'] ) {
					update_user_meta( $user_id, $key, isset( $_POST[ $key ] ) );
				} elseif ( isset( $_POST[ $key ] ) ) {
					update_user_meta( $user_id, $key, wc_clean( wp_unslash( $_POST[ $key ] ) ) );
				}
			}
		}
	}


}
