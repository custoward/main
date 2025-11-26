import Layout from '../components/Layout/Layout';
import { Helmet } from 'react-helmet-async';

const Contact: React.FC = () => {
    return (
        <>
            <Helmet>
                <meta property="og:title" content="Davi-Davi" />
                <meta property="og:description" content="Davi-Davi design studio, Since 2019" />
            </Helmet>
            <div>
                <div className="bg"></div>
                <Layout>
                    <div>Contact us</div>
                    <div>In construction</div>
                </Layout>
            </div>
        </>
    )
}

export default Contact