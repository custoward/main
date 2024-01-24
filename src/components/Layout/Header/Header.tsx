import logo from '../../../public/images/mainlogo.webp'
import "./Header_Style.css"

const Header = () => {
    return (
        <header>
            <img src={logo} className="image"/>
            <hr className='hr'></hr>
            <div className="container">
                <div className='list'>DANDALION</div>
                <div className='list'>VIRUS</div>
                <div className='list'>CONTACT</div>
            </div>
            <hr className='hr'></hr>
        </header>
    );
}

export default Header
