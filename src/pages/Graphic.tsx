import Layout from '../components/Layout/Layout';
import Homecontainer from '../containers/Home/Homecontainer';
import { Helmet } from 'react-helmet-async';

const Graphic: React.FC = () => {
    return (
        <>
            <Helmet>
                <meta property="og:title" content="Davi-Davi" />
                <meta property="og:description" content="Davi-Davi design studio, Since 2019" />
            </Helmet>
            <div>
                <div className="bg"></div>
                <Layout>
                <div>This is graphic</div>
                <div>In construction</div>
                </Layout>
            </div>
        </>
    )
}

export default Graphic