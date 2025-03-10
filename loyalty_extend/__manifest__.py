{
    'name': 'Loyalty Buy X With Y',
    'version': '1.0',
    'category': 'Sales/Promotions',
    'summary': 'Adds a new promotion type: Buy certian products with fixed price',
    'description': """
        This module extends the loyalty program to add a new type of promotion called 'Buy X With Y'.
    """,
    'depends': ['loyalty','web','point_of_sale'],  # Ensure you depend on the base loyalty module
    'data': [
        'views/loyalty_views.xml',
        'views/fixed_price.xml',
        'views/loyalty_reward.xml',
        # 'views/reward_inherit.xml',

    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'loyalty_extend/static/src/app/**/*'
        #    'loyalty_extend/static/src/overrides/models/**/*',
        ],
        # 'web.assets_backend': [
        #     'loyalty_extend/static/src/js/OnClickCard.js',
        #
        # ]

    },

    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}
