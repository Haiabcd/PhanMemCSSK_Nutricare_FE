import { View, Text } from 'react-native';
import { styles } from '../theme/Home.styles';


const Home = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Home</Text>
            <Text style={styles.text}>Welcome to NutriCare</Text>
        </View>
    )
}

export default Home
