import * as React from "react";

const IdeaFormSkeleton = () => {
    return (
        <>
            <div id="panel-new" className="ghost-panel">
                <div id="idea-form-wrap">

                    {/* Top banner */}
                    <div className="skeleton skeleton-banner" />

                    <div className="card">
                        <div className="card-header">
                            <div className="skeleton skeleton-title" />
                        </div>

                        <div className="card-body">

                            {/* Textarea */}
                            <div className="idea-box-wrap">
                                <div className="skeleton skeleton-label" />
                                <div className="skeleton skeleton-textarea" />
                            </div>

                            <div className="divider" />

                            {/* Two columns */}
                            <div className="checks-row">
                                <div>
                                    <div className="skeleton skeleton-label" />
                                    <div className="skeleton skeleton-select" />
                                </div>

                                <div>
                                    <div className="skeleton skeleton-label" />
                                    <div className="skeleton skeleton-select" />
                                </div>
                            </div>

                            <div className="divider" />

                            {/* Attachment */}
                            <div className="skeleton skeleton-label" />
                            <div className="skeleton skeleton-attach" />

                            <div className="divider" />

                            {/* Buttons */}
                            <div className="skeleton skeleton-buttons" />

                            {/* Next steps */}
                            <div className="next-steps">
                                <div className="skeleton skeleton-title small" />
                                <div className="skeleton skeleton-line" />
                                <div className="skeleton skeleton-line" />
                                <div className="skeleton skeleton-line" />
                                <div className="skeleton skeleton-line" />
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default IdeaFormSkeleton;