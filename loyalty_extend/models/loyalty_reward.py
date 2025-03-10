from odoo import models, fields, api,_

class LoyaltyReward(models.Model):
    _inherit = 'loyalty.reward'

    reward_type = fields.Selection(selection_add=[('buy_x_with_y', 'Buy X With Y')], ondelete={'buy_x_with_y': 'set default'})


    # Set the fixed price for this type of promotion
    fixed_price = fields.Float('Fixed Price')
    discount_line_product_id = fields.Many2one('product.product', string='Discount Line Product')


    @api.depends('reward_type', 'fixed_price')
    def _compute_description(self):
        for reward in self:
            if reward.reward_type == 'buy_x_with_y':
                reward.description = _('Buy 4 products for 100 SAR')
                reward.discount_max_amount=self.fixed_price
                # product = self.env['product.product'].search([('name', '=', 'Buy 4 products for 100 SAR')], limit=1)
                #
                # if not product:
                #     # If the product does not exist, create a new one
                #     product = self.env['product.product'].create({
                #         'name': 'Buy 4 products for 100 SAR',
                #         'lst_price':self.fixed_price,
                #         'type': 'service',  # Set as service product or other appropriate type
                #     })
                # else:
                #     # Update the price of the existing product
                #     product.write({
                #         'lst_price':self.fixed_price
                #     })


            else:
                super(LoyaltyReward, self)._compute_description()

    # @api.model
    # def create(self, vals):
    #     # Check if fixed_price exists in vals and has a value
    #     if 'fixed_price' in vals and vals['fixed_price']:
    #         # Search for the product by name
    #         product = self.env['product.product'].search([('name', '=', 'Buy 4 products for 100 SAR')], limit=1)
    #
    #         if not product:
    #             # If the product does not exist, create a new one
    #             product = self.env['product.product'].create({
    #                 'name': 'Buy 4 products for 100 SAR',
    #                 'lst_price': vals['fixed_price'],
    #                 'type': 'service',  # Set as service product or other appropriate type
    #             })
    #         else:
    #             # Update the price of the existing product
    #             product.write({
    #                 'lst_price': vals['fixed_price']
    #             })
    #
    #     # Call the super method to proceed with the standard create process
    #     return super(LoyaltyReward, self).create(vals)

    def _applyReward(self, reward, coupon_id, args):
        if reward.reward_type == 'buy_x_with_y':
            orderlines = self.get_orderlines()
            if len(orderlines) == 4:
                fixed_price = reward.fixed_price
                price_per_product = fixed_price / 4
                for line in orderlines:
                    line.set_unit_price(price_per_product)
                return _('Applied Buy 4 for 100 SAR promotion')
            else:
                return _('You need exactly 4 products to apply this promotion')
        else:
            return super(LoyaltyReward, self)._applyReward(reward, coupon_id, args)

    @api.model
    def get_rewards(self):
        rewards = super(LoyaltyReward, self).get_rewards()
        for reward in rewards:
            if reward['reward_type'] == 'buy_x_with_y':
                reward['fixed_price'] = reward.fixed_price
        return rewards


