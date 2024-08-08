import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout/Layout';
import Homecontainer from '../containers/Home/Homecontainer';

const HomePage: React.FC = () => {
    return (
        <>
            <Helmet>
                <meta property="og:title" content="Davi-Davi" />
                <meta property="og:description" content="Davi-Davi design studio, Since 2019" />
            </Helmet>
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