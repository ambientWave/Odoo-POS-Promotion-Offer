from odoo import models, fields, api, _
class LoyaltyRule(models.Model):
    _inherit = 'loyalty.rule'

    is_buy_x_with_y = fields.Boolean(string="Apply Buy X With Y")
    product_ids = fields.Many2many('product.product', string="Products")
    fixed_price = fields.Float(string="Fixed Price")
    Quantity = fields.Integer(string="Quantity")
    program_items_name = {
        # Existing items
        'buy_x_with_y': 'Buy X With Y',  # Add the correct display name
        # Other items...
    }
