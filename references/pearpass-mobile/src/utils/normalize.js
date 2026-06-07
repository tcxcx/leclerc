import { Dimensions } from 'react-native'

const { height } = Dimensions.get('window')

const scale = height / 932

export const normalize = (size) => size * scale
