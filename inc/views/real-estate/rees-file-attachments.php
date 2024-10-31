<?php defined( 'ABSPATH' ) || exit; ?>
<div id="real_estate_file_options" class="woocommerce_options_panel panel wc-metaboxes-wrapper hidden">
    <div class="woocommerce_variable_attributes wc-metabox-content ">
        <div class="data">
            <div class="form-field  downloadable_files">
                <label><?php esc_html_e( 'File Attachments', 'rees-real-estate-for-woo' ); ?></label>
                <table class="widefat">
                    <thead>
                    <tr>
                        <th class="sort">&nbsp;</th>
                        <th><?php esc_html_e( 'Name', 'rees-real-estate-for-woo' ); ?> <span class="woocommerce-help-tip"
                                                                                    tabindex="0"
                                                                                    aria-label="<?php esc_attr_e( 'This is the name of the file attachment shown to the customer.', 'rees-real-estate-for-woo' ); ?>"
                                                                                    data-tip="<?php esc_attr_e( 'This is the name of the file attachment shown to the customer.', 'rees-real-estate-for-woo' ); ?>"></span>
                        </th>
                        <th colspan="2"><?php esc_html_e( 'File URL', 'rees-real-estate-for-woo' ); ?> <span
                                    class="woocommerce-help-tip" tabindex="0"
                                    aria-label="<?php esc_attr_e( 'This is the URL or absolute path to the file which customers will get access to', 'rees-real-estate-for-woo' ); ?>"
                                    data-tip="<?php esc_attr_e( 'This is the URL or absolute path to the file which customers will get access to', 'rees-real-estate-for-woo' ); ?>"></span>
                        </th>
                        <th>&nbsp;</th>
                    </tr>
                    </thead>
                    <tbody class="ui-sortable" style="">
					<?php

					if ( ! empty( $woore_file_attach ) ) :
                        foreach ( $woore_file_attach as $item ) : ?>
                            <tr>
                                <td class="sort"></td>
                                <td class="file_name">
                                    <input type="text" class="input_text"
                                           placeholder="<?php esc_attr_e( 'File name', 'rees-real-estate-for-woo' ); ?>"
                                           name="woorealestate_file_attach_name[]"
                                           value="<?php echo ! empty( $item[0] ) ? esc_attr( $item[0] ) : ''; ?>">
                                </td>
                                <td class="file_url">
                                    <input type="text" class="input_text" placeholder="<?php esc_attr_e( 'http://', 'rees-real-estate-for-woo' ); ?>"
                                           name="woorealestate_file_attach_url[]"
                                           value="<?php echo ! empty( $item[1] ) ? esc_attr( $item[1] ) : ''; ?>">
                                </td>
                                <td class="file_url_choose" width="1%"><a href="#" class="button upload_file_button"
                                                                          data-choose="<?php esc_attr_e( 'Choose file', 'rees-real-estate-for-woo' ); ?>"
                                                                          data-update="<?php esc_attr_e( 'Insert file URL', 'rees-real-estate-for-woo' );?>"><?php esc_html_e( 'Choose file', 'rees-real-estate-for-woo' ); ?></a>
                                </td>
                                <td width="1%"><a href="#"
                                                  class="delete"><?php esc_html_e( 'Delete', 'rees-real-estate-for-woo' ); ?></a>
                                </td>
                            </tr>
                        <?php endforeach;
					endif;
					?>
                    </tbody>
                    <?php
                    ob_start();
                    ?>
                    <tr>
                        <td class="sort"></td>
                        <td class="file_name">
                            <input type="text" class="input_text" placeholder="<?php esc_attr_e( 'File name', 'rees-real-estate-for-woo' ); ?>" name="woorealestate_file_attach_name[]" value="" />
                        </td>
                        <td class="file_url">
                            <input type="text" class="input_text" placeholder="<?php esc_attr_e( 'http://', 'rees-real-estate-for-woo' ); ?>" name="woorealestate_file_attach_url[]" value="" />
                        </td>
                        <td class="file_url_choose" width="1%"><a href="#" class="button upload_file_button" data-choose="<?php esc_attr_e( 'Choose file', 'rees-real-estate-for-woo' ); ?>" data-update="<?php esc_attr_e( 'Insert file URL', 'rees-real-estate-for-woo' ); ?>"><?php esc_html_e( 'Choose file', 'rees-real-estate-for-woo' ); ?></a></td>
                        <td width="1%"><a href="#" class="delete"><?php esc_html_e( 'Delete', 'rees-real-estate-for-woo' ); ?></a></td>
                    </tr>
                    <?php
                    $data_row = ob_get_clean();
                    ?>
                    <tfoot>
                    <tr>
                        <th colspan="2">
                            <a href="#" class="button insert" data-row="<?php echo esc_attr( $data_row )?>"><?php esc_attr_e( 'Add File', 'rees-real-estate-for-woo' ); ?></a>
                        </th>
                        <th colspan="3">
                        </th>
                    </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>

