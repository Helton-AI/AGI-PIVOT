"use client";

import { useFormState, useFormStatus } from "react-dom";
import { onSubmit } from "../lib/action";
import { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "./error-boundary";

const initialState = {
    code: 0,
    errorMsg: "",
};

export default function Component() {
    const [state, formAction] = useFormState(onSubmit, initialState);
    const uploadFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.code !== 0 && uploadFormRef.current) {
            uploadFormRef.current.reset();
        }
    }, [state, uploadFormRef]);

    return (
        <ErrorBoundary>
            <div className="text-white flex flex-col items-center justify-center">
                <div className="container my-3 flex flex-col items-center justify-center">
                    <h1>Walrus Blob Upload</h1>
                    <p className="lead">An example uploading and displaying files with Walrus.</p>
                </div>
                <div className="align-items-start gx-5 flex items-center justify-center">
                    <section className="col-lg-5 mb-3">
                        <hgroup>
                            <h2>Blob Upload</h2>
                            <p>
                                Upload blobs to Walrus, and display them on this page. See the
                                <a href="https://docs.walrus.site" target="_blank">
                                    Walrus documentation
                                </a>{" "}
                                for more information. The file size is limited to 10 MiB on the default publisher. Use the{" "}
                                <a href="https://docs.walrus.site/usage/client-cli.html" target="_blank">
                                    CLI tool
                                </a>{" "}
                                to store bigger files.
                            </p>
                        </hgroup>

                        <form id="upload-form" ref={uploadFormRef} action={formAction} className="mb-3">
                            <FieldSet />
                        </form>
                        <div id="alert" className="alert alert-danger" role="alert" style={{ visibility: state.code >= 0 ? "hidden" : "visible" }}>
                            {state?.errorMsg}
                        </div>
                    </section>
                    {/* <section className="col-lg-7">
                    <h2>Uploaded Blobs</h2>
                    <div id="uploaded-blobs"></div>
                </section> */}
                </div>
            </div>
        </ErrorBoundary>
    );
}

const defaultPublisher = "https://publisher.walrus-testnet.walrus.space";
const defaultAggregator = "https://aggregator.walrus-testnet.walrus.space";

export function FieldSet() {
    const { pending } = useFormStatus();
    const [publisher, setPublisher] = useState(defaultPublisher);
    const [aggregator, setAggregator] = useState(defaultAggregator);

    return (
        <fieldset className="row g-3" {...{ disabled: pending }}>
            <div className="col-lg-6">
                <label htmlFor="publisher-url-input" className="form-label">
                    Walrus publisher URL
                </label>
                <input
                    id="publisher-url-input"
                    name="basePublisherUrl"
                    type="url"
                    className="form-control"
                    placeholder={defaultPublisher}
                    value={publisher}
                    required
                    onChange={(e) => {
                        setPublisher(e.target.value);
                    }}
                />
            </div>

            <div className="col-lg-6">
                <label htmlFor="aggregator-url-input" className="form-label">
                    Walrus aggregator URL
                </label>
                <input
                    id="aggregator-url-input"
                    name="baseAggregatorUrl"
                    type="url"
                    className="form-control"
                    placeholder={defaultAggregator}
                    value={aggregator}
                    required
                    onChange={(e) => {
                        setAggregator(e.target.value);
                    }}
                />
            </div>

            <div className="col-12">
                <label htmlFor="file-input" className="form-label">
                    Blob to upload (<strong>Max 10 MiB size</strong> on the default publisher!)
                </label>
                <input id="file-input" name="file" type="file" className="form-control" required aria-label="upload" />
            </div>

            <div className="col-12">
                <label htmlFor="epochs-input" className="form-label">
                    Epochs
                </label>

                <input id="epochs-input" name="numEpochs" type="number" defaultValue={"1"} min="1" placeholder="Epochs" className="form-control" required />
                <div className="form-text text-white">The number of Walrus epochs for which to store the blob.</div>
            </div>

            <button id="submit" className="btn btn-primary space-x-2" disabled={pending}>
                {pending && <span id="submit-spinner" className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                <span id="submit-text" role="status">
                    {pending ? "Uploading ..." : "Upload Image"}
                </span>
            </button>
        </fieldset>
    );
}
