"use server";

import { cookies } from "next/headers";

const SUI_NETWORK = "testnet";
const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

/**
 * Handler for submit events from the HTML form.
 *
 * Stores the blob provided in the form, and disable the default HTML form submission.
 */
export async function onSubmit(previousState, formData) {
    // Store and display the blob, then re-enable the form.
    const res = await storeBlob(formData)
        .then((storageInfo) => {
            return displayUpload(storageInfo.info, storageInfo.media_type, formData);
            // alert(null);
            // enableForm(true);
        })
        .catch((error) => {
            console.error(error);
            // alert(
            //     "An error occurred while uploading. Check the browser console and ensure that \
            //         the aggregator and publisher URLs are correct."
            // );
            // enableForm(true);
            return {
                code: -3,
                errorMsg:
                    "An error occurred while uploading. Check the browser console and ensure that \
                 the aggregator and publisher URLs are correct.",
            };
        });

    return res;
    // // Return false to cancel form submission.
    // return;
}

export async function getDataList() {
    const dataListStr = cookies().get("dataList")?.value;
    if (dataListStr) {
        return JSON.parse(dataListStr);
    }
    return [];
}

/**
 * Stores the file from the HTML form on Walrus.
 */
function storeBlob(formData) {
    const inputFile = formData.get("inputFile");
    const numEpochs = formData.get("numEpochs");
    const basePublisherUrl = formData.get("basePublisherUrl");

    // Submit a PUT request with the file's content as the body to the /v1/store endpoint.
    return fetch(`${basePublisherUrl}/v1/store?epochs=${numEpochs}`, {
        method: "PUT",
        body: inputFile,
    }).then((response) => {
        if (response.status === 200) {
            // Parse successful responses as JSON, and return it along with the
            // mime type from the the file input element.
            return response.json().then((info) => {
                return { info: info, media_type: inputFile.type };
            });
        } else {
            return {
                code: -1,
                errorMsg: "Something went wrong when storing the blob!",
            };
        }
    });
}

/**
 * Display the result of uploading the file to Walrus.
 */
function displayUpload(
    storage_info: { alreadyCertified: { blobId: any; endEpoch: any; event: { txDigest: any } }; newlyCreated: { blobObject: { blobId: any; storage: { endEpoch: any }; id: any } } },
    media_type: string,
    formData: any
) {
    // Extract the displayed fields from either of the two successful responses:
    // - newlyCreated for blobs that have been uploaded for the first time,
    //   or whose duration has been extended.
    // - alreadyCertified for blobs that have already been uploaded and certified.
    let info;
    if ("alreadyCertified" in storage_info) {
        info = {
            status: "Already certified",
            blobId: storage_info.alreadyCertified.blobId,
            endEpoch: storage_info.alreadyCertified.endEpoch,
            suiRefType: "Previous Sui Certified Event",
            suiRef: storage_info.alreadyCertified.event.txDigest,
            suiBaseUrl: SUI_VIEW_TX_URL,
        };
    } else if ("newlyCreated" in storage_info) {
        info = {
            status: "Newly created",
            blobId: storage_info.newlyCreated.blobObject.blobId,
            endEpoch: storage_info.newlyCreated.blobObject.storage.endEpoch,
            suiRefType: "Associated Sui Object",
            suiRef: storage_info.newlyCreated.blobObject.id,
            suiBaseUrl: SUI_VIEW_OBJECT_URL,
        };
    } else {
        // throw Error("Unhandled successful response!");
        return {
            code: -2,
            errorMsg: "Unhandled successful response!",
        };
    }

    // The URL used to download and view the blob.
    const baseAggregatorUrl = formData.get("baseAggregatorUrl");
    const blobUrl = `${baseAggregatorUrl}/v1/${info.blobId}`;

    // The URL for viewing the event or object on chain
    const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;

    const isImage = media_type.startsWith("image");
    // Create the HTML entry in the page for the uploaded blob.
    //
    // For the associated icon, we use the `<object/>` HTML element, as it allows specifying
    // the media type. The walrus aggregator returns blobs as `application/octect-stream`,
    // so it's necessary to specify the content type to the browser in the `object` element.

    // document.getElementById("uploaded-blobs").insertAdjacentHTML(
    //     "afterBegin",
    //     `<article class="row border rounded-2 shadow-sm mb-3">
    //       <object type="${isImage ? media_type : ""}" data="${isImage ? blobUrl : ""}" class="col-4 ps-0"></object>
    //       <dl class="blob-info col-8 my-2">
    //         <dt>Status</dt><dd>${info.status}</dd>

    //         <dt>Blob ID</dt>
    //         <dd class="text-truncate"><a href="${blobUrl}">${info.blobId}</a></dd>

    //         <dt>${info.suiRefType}</dt>
    //         <dd class="text-truncate">
    //           <a href="${suiUrl}" target="_blank">${info.suiRef}</a>
    //         </dd>
    //         <dt>Stored until epoch</dt><dd>${info.endEpoch}</dd>
    //       </dl>
    //     </article>`
    // );
    const data = {
        blobUrl,
        suiUrl,
        isImage,
    };

    const dataListStr = cookies().get("dataList");

    let dataList = [];
    if (dataListStr?.value) {
        dataList = JSON.parse(dataListStr.value);
    }
    cookies().set("dataList", JSON.stringify([data, ...dataList]));

    return { code: 1, data };
}
