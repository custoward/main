import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout/Layout';
import Homecontainer from '../containers/Home/Homecontainer';

const HomePage : React.FC = () => {
    return (
        <>
        <div>
        <div className="bg"></div>
        <Layout>
            <Homecontainer />
        </Layout>
        </div>
        </>
    )
}

export default HomePage