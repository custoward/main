import Footer from './Footer/Footer'
import Header from './Header/Header'
import Canvas from './canvas';
import "./style.css"

const Layout = (props: { children: React.ReactNode }) => {
    return (
        <div className="background">
            <div className='bg' />
            <Canvas />
            <div className='Wrapper'>
                <div className='ContentWrapper'>
                    <Header/>
                    <main>
                        {props.children}
                    </main>
                    <Footer/>
                </div>
            </div>

        </div>
    );
}

export default Layout