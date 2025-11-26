import { mainlogo as logo } from '../../../assets/';
import "./Header_Style.css"

const Header = () => {
    return (
        <header>
            <a href="/"><img src={logo} className="image" alt="DAVI-DAVI Logo" /></a>
            <div className='Hcontainer'>
                <div className='instruction'>Since 2021, Clickin-buckle, Custoward, and finally</div>
                <div className='instruction'>DAVI-DAVI</div>
            </div>
            <hr className='hr'></hr>
            <div className="container">
                <a className='list' href="/Designer">About us</a>
                <a className='list' href="/Portfolio">Portfolio</a>
                <a className='list' href="/Contact">Contact</a>
            </div>
            <hr className='hr'></hr>
        </header>
    );
}

export default Header
