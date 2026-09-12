import { productPresentationDefinitionSchema } from './productPresentationSchema'
import {
  TECH_DOWN_HIDDEN_SIZES,
  TECH_DOWN_SIZE_VALUE_MAP
} from '../techDownSizes'

const commonGenderOption = {
  key: 'gender',
  publicName: 'Kjønn',
  publicParam: 'kjonn',
  shopifyNames: ['Kjønn', 'Gender'],
  valueMap: { unisex: 'Unisex' },
  defaultPublicValue: 'Unisex'
} as const

export const productPresentationDefinitions =
  productPresentationDefinitionSchema.array().parse([
    {
      publicHandle: 'utekos-techdown',
      displayName: 'Utekos TechDown™',
      description:
        'Utekos TechDown™ er et varmt og allsidig 3-i-1-plagg med Luméa™-ytterstoff og CloudWeave™-isolasjon for terrasse, hytte, båt og bobil.',
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: { havdyp: 'Havdyp' },
          defaultPublicValue: 'Havdyp'
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: TECH_DOWN_SIZE_VALUE_MAP
        },
        commonGenderOption
      ],
      hiddenOptionValues: { size: TECH_DOWN_HIDDEN_SIZES },
      media: {
        defaultAlt: 'Utekos TechDown™ i mørkeblå Havdyp.',
        variantAltPrefix: 'Utekos TechDown™'
      },
      category: 'Yttertøy',
      material:
        'Luméa™-ytterstoff i nylon og syntetisk CloudWeave™-isolasjon',
      audience: 'Unisex'
    },
    {
      publicHandle: 'utekos-mikrofiber',
      displayName: 'Utekos Mikrofiber™',
      description:
        'Utekos Mikrofiber™ er et lett, pakkbart og hurtigtørkende 3-i-1-plagg for bobil, båt, hytte, terrasse og reise.',
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
      publicHandle: 'utekos-dun',
      displayName: 'Utekos Dun™',
      description:
        'Utekos Dun™ er et varmt 3-i-1-plagg med 650 fillpower dun for kalde og tørre kvelder på terrasse, hytte og tur.',
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
      publicHandle: 'utekos-stapper',
      displayName: 'Utekos Stapper™',
      description:
        'Utekos Stapper™ er en lett kompresjonsbag med fire justerbare stropper for klær, soveposer og utstyr på tur, i båt og bobil.',
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: { vargnatt: 'Vargnatt', svart: 'Vargnatt' },
          defaultPublicValue: 'Vargnatt'
        },
        {
          key: 'size',
          publicName: 'Størrelse',
          publicParam: 'storrelse',
          shopifyNames: ['Størrelse', 'Size', 'Str'],
          valueMap: {
            'onesize': 'OneSize',
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
      publicHandle: 'comfyrobe',
      displayName: 'Comfyrobe™',
      description:
        'Comfyrobe™ er en værbeskyttende og romslig robe med varm SherpaCore™-innside for før og etter isbad, bading og annen aktivitet ute.',
      options: [
        {
          key: 'color',
          publicName: 'Farge',
          publicParam: 'farge',
          shopifyNames: ['Farge', 'Color'],
          valueMap: { fjellnatt: 'Fjellnatt' },
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
