import { Layout } from '../components/Layout';
import Homecontainer from '../containers/Home/Homecontainer';
import { Helmet } from 'react-helmet-async';
import { ProjectList } from '../components/Portfolio';

const PortfolioMain: React.FC = () => {
    return (
        <>
            <Helmet>
                <meta property="og:title" content="Davi-Davi" />
                <meta property="og:description" content="Davi-Davi design studio, Since 2019" />
            </Helmet>
            <div>
                <Layout>
                <ProjectList />
                </Layout>
            </div>
        </>
    )
}

export default PortfolioMain