import { StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { BASE_URL } from '../config';


const { height, width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();


  return (
    <View style={styles.container}>
      
      <View style={styles.box}>
        <Text style={styles.text}>GymBase</Text>
      </View>

      <View style={{ position: 'absolute', bottom: 0, width: '120%', height: '50%', left: '-10%' }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
          <Path d="M 0 0 L 120 120 L 0 120 Z" fill="orange" />
        </Svg>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Register')}>
        <Ionicons name="arrow-forward" size={28} color="white" />
      </TouchableOpacity>

     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text:{
    color: 'black',
    fontSize: 30, 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginTop: 55, 
  },
  box: {
    backgroundColor: 'orange',
    width: '50%',
    height: 150,
    borderRadius: 10,
    marginBottom: '60%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10, //ios
    elevation: 30, //android
  },
  
  button: {
    position: 'absolute',
    bottom: height * 0.20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    //zIndex: 3, 
  },
});
