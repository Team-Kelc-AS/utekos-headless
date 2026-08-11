import { productPresentationDefinitionSchema } from './productPresentationSchema'

const commonGenderOption = {
  key: 'gender',
  publicName: 'Kjønn',
  publicParam: 'kjonn',
  shopifyNames: ['Kjønn', 'Gender'],
  valueMap: {
    unisex: 'Unisex'
  },
  defaultPublicValue: 'Unisex'
} as const

export const productPresentationDefinitions =
  productPresentationDefinitionSchema.array().parse([
    {
      productKey: 'utekos-techdown',
      publicHandle: 'utekos-techdown',
      canonicalPath: '/produkter/utekos-techdown',
      storefrontLookupHandle: 'utekos-techdown',
      displayName: 'Utekos TechDown™',
      productGroupID: 'utekos-techdown',
      contentKey: 'utekos-techdown',
      description:
        'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg med Luméa™-ytterstoff og CloudWeave™-isolasjon for terrasse, hytte, båt og bobil.',
      publicOptionOrder: ['color', 'size', 'gender'],
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: {
            havdyp: 'Havdyp'
          },
          defaultPublicValue: 'Havdyp'
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            liten: 'Liten',
            small: 'Liten',
            s: 'Liten',
            middels: 'Middels',
            medium: 'Middels',
            m: 'Middels',
            stor: 'Stor',
            large: 'Stor',
            l: 'Stor',
            'ekstra stor': 'Ekstra stor',
            'extra large': 'Ekstra stor',
            xl: 'Ekstra stor'
          }
        },
        commonGenderOption
      ],
      hiddenOptionValues: {
        size: ['Liten']
      },
      media: {
        defaultAlt:
          'Utekos TechDown™ i mørkeblå Havdyp.',
        variantAltPrefix: 'Utekos TechDown™'
      },
      category: 'Yttertøy',
      material:
        'Luméa™-ytterstoff i nylon og syntetisk CloudWeave™-isolasjon',
      audience: 'Unisex'
    },
    {
      productKey: 'utekos-mikrofiber',
      publicHandle: 'utekos-mikrofiber',
      canonicalPath: '/produkter/utekos-mikrofiber',
      storefrontLookupHandle: 'utekos-mikrofiber',
      displayName: 'Utekos Mikrofiber™',
      productGroupID: 'utekos-mikrofiber',
      contentKey: 'utekos-mikrofiber',
      description:
        'Utekos Mikrofiber™ er et lett, pakkbart og hurtigtørkende 3-i-1-plagg for bobil, båt, hytte, terrasse og reise.',
      publicOptionOrder: ['color', 'size', 'gender'],
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: {
            vargnatt: 'Vargnatt',
            fjellbla: 'Fjellblå',
            fjellblå: 'Fjellblå'
          }
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            medium: 'Medium',
            m: 'Medium',
            large: 'Large',
            l: 'Large'
          }
        },
        commonGenderOption
      ],
      hiddenOptionValues: {},
      media: {
        defaultAlt: 'Utekos Mikrofiber™ utendørs.',
        variantAltPrefix: 'Utekos Mikrofiber™'
      },
      category: 'Yttertøy',
      material:
        'DuraLite™ Nylon med syntetisk mikrofiberisolasjon',
      audience: 'Unisex'
    },
    {
      productKey: 'utekos-dun',
      publicHandle: 'utekos-dun',
      canonicalPath: '/produkter/utekos-dun',
      storefrontLookupHandle: 'utekos-dun',
      displayName: 'Utekos Dun™',
      productGroupID: 'utekos-dun',
      contentKey: 'utekos-dun',
      description:
        'Utekos Dun™ er et varmt 3-i-1-plagg med 650 fillpower dun for kalde og tørre kvelder på terrasse, hytte og tur.',
      publicOptionOrder: ['color', 'size', 'gender'],
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: {
            vargnatt: 'Vargnatt',
            fjellbla: 'Fjellblå',
            fjellblå: 'Fjellblå',
            havdyp: 'Havdyp'
          }
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            medium: 'Medium',
            m: 'Medium',
            middels: 'Middels',
            large: 'Large',
            l: 'Large',
            stor: 'Stor'
          }
        },
        commonGenderOption
      ],
      hiddenOptionValues: {},
      media: {
        defaultAlt: 'Utekos Dun™ utendørs.',
        variantAltPrefix: 'Utekos Dun™'
      },
      category: 'Yttertøy',
      material: '650 fillpower dun og DWR-behandlet nylon',
      audience: 'Unisex'
    },
    {
      productKey: 'utekos-stapper',
      publicHandle: 'utekos-stapper',
      canonicalPath: '/produkter/utekos-stapper',
      storefrontLookupHandle: 'utekos-stapper',
      displayName: 'Utekos Stapper™',
      productGroupID: 'utekos-stapper',
      contentKey: 'utekos-stapper',
      description:
        'Utekos Stapper™ er en lett kompresjonsbag med fire justerbare stropper for klær, soveposer og utstyr på tur, i båt og bobil.',
      publicOptionOrder: ['color', 'size', 'gender'],
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: {
            vargnatt: 'Vargnatt',
            svart: 'Vargnatt'
          },
          defaultPublicValue: 'Vargnatt'
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            onesize: 'OneSize',
            'one size': 'OneSize'
          },
          defaultPublicValue: 'OneSize'
        },
        commonGenderOption
      ],
      hiddenOptionValues: {},
      media: {
        defaultAlt: 'Utekos Stapper™ kompresjonsbag.',
        variantAltPrefix: 'Utekos Stapper™ kompresjonsbag'
      },
      category: 'Kompresjonsbag',
      material: 'Slitesterkt kompresjonsstoff',
      audience: 'Unisex'
    },
    {
      productKey: 'comfyrobe',
      publicHandle: 'comfyrobe',
      canonicalPath: '/produkter/comfyrobe',
      storefrontLookupHandle: 'comfyrobe',
      displayName: 'Comfyrobe™',
      productGroupID: 'comfyrobe',
      contentKey: 'comfyrobe',
      description:
        'Comfyrobe™ er en værbeskyttende og romslig robe med varm SherpaCore™-innside for før og etter isbad, bading og annen aktivitet ute.',
      publicOptionOrder: ['color', 'size', 'gender'],
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: {
            fjellnatt: 'Fjellnatt'
          },
          defaultPublicValue: 'Fjellnatt'
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            xs: 'XS',
            s: 'S',
            m: 'M',
            l: 'L',
            xl: 'XL'
          }
        },
        commonGenderOption
      ],
      hiddenOptionValues: {},
      media: {
        defaultAlt: 'Comfyrobe™ i fargen Fjellnatt.',
        variantAltPrefix: 'Comfyrobe™'
      },
      category: 'Værbeskyttende robe',
      material: 'HydroGuard™-skall og SherpaCore™-fôr',
      audience: 'Unisex'
    }
  ])
