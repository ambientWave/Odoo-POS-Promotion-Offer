from odoo import models, fields, api

class LoyaltyProgram(models.Model):
    _inherit = 'loyalty.program'
    program_type = fields.Selection(selection_add=[('buy_x_with_y', 'Buy X With Y')
        ],
        ondelete={'buy_x_with_y': 'cascade'}
    )

    @api.model
    def create_buy_x_with_y_program(self):
        program = self.env['loyalty.program'].create({
            'name': 'Buy X With Y',
            'program_type': 'buy_x_with_y',
            'reward_ids': [(0, 0, {
                'reward_type': 'buy_x_with_y',
                'fixed_price': 100,
                'reward_product_ids': [(6, 0, self.get_product_ids())],  # Get eligible products
            })]
        })
        return program

    def get_product_ids(self):
        # Fetch the product ids eligible for the 'Buy X With Y' promotion
        return self.env['product.product'].search([('categ_id', '=', self.env.ref('product.product_category_all').id)]).ids

    @api.depends('coupon_count', 'program_type')
    def _compute_coupon_count_display(self):
        program_items_name = {
            'buy_x_with_y': 'Buy X With Y',
            # Add other types...
        }

        for program in self:  # This makes `program` defined
            # Your logic here
            program.coupon_count_display = "%i %s" % (
                program.coupon_count or 0,
                program_items_name.get(program.program_type, 'Buy X With Y')
            )
