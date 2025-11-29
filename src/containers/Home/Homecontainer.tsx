import "../../components/Layout/style.css"
import "./Homecontainer.css"
import { SAMPLE_PROJECTS } from "../../components/Portfolio/ProjectList"
import React from "react"

const Homecontainer = () => {
    // 최근 5개 프로젝트 가져오기 (날짜 기준 내림차순)
    const recentProjects = [...SAMPLE_PROJECTS]
        .sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return b.date.localeCompare(a.date);
        })
        .slice(0, 5);

    // 프로젝트별 라우트 매핑
    const getProjectRoute = (projectId: string) => {
        if (projectId === 'proj-1') return '/typo-moss';
        if (projectId === 'proj-2') return '/breath-hidden-city';
        return '#';
    };

    // 날짜를 수량과 가격으로 변환 (25/11 -> 수량: 25, 가격: 11.25)
    const parseDateToPrice = (date?: string) => {
        if (!date) return { quantity: 1, price: 0 };
        const [year, month] = date.split('/');
        return {
            quantity: parseInt(year),
            price: parseFloat(`${month}.${year}`)
        };
    };

    // 총액 계산
    const totalAmount = recentProjects.reduce((sum, project) => {
        const { price } = parseDateToPrice(project.date);
        return sum + price;
    }, 0);

    return (
        <div style={{ height: "700px" }}>
            <div className="main">
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
                <div className="maincontainer">
                    <div className="mainhead" >Recent Portfolio</div>
                    {recentProjects.map((project) => {
                        const { quantity, price } = parseDateToPrice(project.date);
                        return (
                            <React.Fragment key={project.id}>
                                <a 
                                    href={getProjectRoute(project.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mainlist mainlist-link"
                                >
                                    {project.englishTitle || project.title}
                                </a>
                                <div className="maincost">{quantity}x</div>
                                <div className="maincost">${price.toFixed(2)}</div>
                            </React.Fragment>
                        );
                    })}
                </div>
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
                <div className="maincontainer">
                    <div className="mainhead" >TOTAL AMOUNT</div>
                    <div className="mainlist">CASH</div>
                    <div className="maincost"></div>
                    <div className="maincost">${totalAmount.toFixed(2)}</div>
                    <div className="mainlist">CHANGE</div>
                    <div className="maincost"></div>
                    <div className="maincost">${Math.ceil(totalAmount)}.00</div>
                    <div className="mainlist"></div>
                    <div className="maincost"></div>
                    <div className="maincost">${(Math.ceil(totalAmount) - totalAmount).toFixed(2)}</div>
                </div>
                <hr className='hr' style={{ borderTop: "dotted"}}></hr>
            </div>
            <hr className='hr'></hr>
            <div>
                <p style={{ fontSize: "var(--font-size-sm)", fontWeight:"1000"}}>Welcome to our Playground!</p>
            </div>
        </div>
    )
}

export default Homecontainer