import Footer from './Footer'
import Header from './Header'
import Background from './Background';
import Canvas from './canvas';
import Contents from './Contents';
import "./style.css"

const Layout = (props : {children: React.ReactNode}) =>{
    return(
        <div>
            <Background>
                <Contents>
                    <div className='Wrapper'>
                        <div className='ContentWrapper'>
                            <Header />

                            <main>
                              {props.children}
                            </main>
                        </div>
                        <Footer />
                    </div>
                    
                </Contents>
            
                <Canvas />
            </Background>
        </div>
    );
}

export default Layout