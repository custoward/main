import "../style.css"
import "./Footer_Style.css"

const Footer = () => {

    return (
        <footer className="Footer">
            <div className="fcontainer">
                <div className="flist">
                    <a href="https://www.instagram.com/davi_davi_dandelionvirus?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        style={{ fontSize: "var(--font-size-ssm)", textDecoration: "none", color: "white" }}
                        target="_blank">
                        <a href="https://www.instagram.com/davi_davi.design/" target='blank'> visit our instagram @davi-davi.design</a>
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default Footer