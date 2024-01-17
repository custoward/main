import "../style.css"
import "./Footer_Style.css"

const Footer = () => {

    return (
        <footer className="Footer">
            <div className="fcontainer">
                <div className="flist">Design makes world better.</div>
                <div className="flist">
                    <a href="https://www.instagram.com/custoward.official?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                       style={{textDecoration: "none", color: "black"}}
                       target="_blank">
                        <div>instagram @custoward.official</div>
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer