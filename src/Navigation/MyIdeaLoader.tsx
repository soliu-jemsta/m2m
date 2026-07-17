import * as React from "react";

// import '../Assets/css/style.css';

export const MyIdeaLoader = () => {
    return (
        <>
            <div className="idea-skel-card">
                <div className="idea-skel-avatar shimmer"></div>

                <div className="idea-skel-body">
                    <div className="idea-skel-title shimmer"></div>
                    <div className="idea-skel-meta shimmer"></div>

                    <div className="idea-skel-badges">
                        <span className="idea-skel-badge shimmer"></span>
                        <span className="idea-skel-badge shimmer"></span>
                    </div>

                    <div className="idea-skel-expand">
                        <div className="idea-skel-line shimmer"></div>
                        <div className="idea-skel-line short shimmer"></div>
                    </div>
                </div>

                <div className="idea-skel-right">
                    <span className="idea-skel-badge shimmer"></span>
                </div>
            </div>
        </>
    );
};