import Layout from '../components/Layout/Layout';
import Homecontainer from '../containers/Home/Homecontaioner';

const HomePage = () => {
    return(
        <div>
        <div className="bg"></div>
        <Layout>
            
            <Homecontainer />
        </Layout>
        </div>
    )
}

export default HomePage