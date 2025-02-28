import React from 'react';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import '../index.css';
import PropTypes from "prop-types";
import { useLocation } from 'react-router-dom';

const Certificate = ({ certificateData }) => {
    const location = useLocation();

    const downloadPDF = () => {
        const elementToConvert = document.querySelector('.course-professional');

        const options = {
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, width: 1173 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().from(elementToConvert).set(options).save('webpage.pdf');
    };

    const downloadJPEG = () => {
        const elementToConvert = document.querySelector('.course-professional');

        html2canvas(elementToConvert).then(canvas => {
            const imageDataURL = canvas.toDataURL('image/jpeg');

            const link = document.createElement('a');
            link.href = imageDataURL;
            link.download = 'webpage.jpg';
            link.click();
        });
    };

    return (
        <div>
            <header className="m-2 top-0 flex items-end justify-end ml-[200px]">
                <button
                    className="text-cyan-950 p-2 underline"
                    onClick={() => window.history.back()}
                >
                    Back to Courses
                </button>
            </header>

            <div className="mx-auto flex items-center justify-center flex-col mt-[100px] p-2">
                <div className="course-professional" id="certificate">
                    <div className="overlap-wrapper">
                        <div className="overlap">
                            <img
                                className="whatsapp-image"
                                src="/whatsapp-image-2023-09-28-at-9-16-1.png"
                                alt="WhatsApp"
                            />
                            <div className="group">
                                <div className="overlap-group">
                                    <div className="rectangle"></div>
                                    <div className="div"></div>
                                    <img
                                        className="img"
                                        src="/rectangle-423.svg"
                                        alt="Rectangle 423"
                                    />
                                    <img
                                        className="rectangle-2"
                                        src="/rectangle-424.svg"
                                        alt="Rectangle 424"
                                    />
                                    <div className="ellipse-wrapper">
                                        <div className="ellipse"></div>
                                    </div>
                                    <div className="div-wrapper">
                                        <div className="ellipse"></div>
                                    </div>
                                    <div className="group-2">
                                        <div className="ellipse"></div>
                                    </div>
                                    <div className="group-3">
                                        <div className="ellipse"></div>
                                    </div>
                                </div>
                            </div>
                            <img
                                className="group-4"
                                src="/group-329.png"
                                alt="Group 329"
                            />
                            <div className="group-5">
                                <div className="overlap-2">
                                    <div className="overlap-3">
                                        <div className="text-wrapper">
                                            {certificateData.issue_date}
                                        </div>
                                        <div className="overlap-group-wrapper">
                                            <div className="overlap-4">
                                                <div className="group-6">
                                                    <div className="overlap-group-2">
                                                        <div className="ellipse-2"></div>
                                                        <div className="ellipse-3"></div>
                                                        <div className="ellipse-4"></div>
                                                        <div className="text-wrapper-2">Verified Certificate</div>
                                                        <img
                                                            className="element"
                                                            src="/2023.png"
                                                            alt="2023"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group-7">
                                                    <img
                                                        className="star"
                                                        src="/star-6.svg"
                                                        alt="Star 6"
                                                    />
                                                    <img
                                                        className="star-2"
                                                        src="/star-6.svg"
                                                        alt="Star 6"
                                                    />
                                                    <img
                                                        className="star-3"
                                                        src="/star-7.svg"
                                                        alt="Star 7"
                                                    />
                                                    <img
                                                        className="star-4"
                                                        src="/star-6.svg"
                                                        alt="Star 6"
                                                    />
                                                    <img
                                                        className="star-5"
                                                        src="/star-7.svg"
                                                        alt="Star 7"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overlap-5">
                                        <div className="certificate-of">CERTIFICATE<br />OF ACHIEVEMENT</div>
                                        <div className="text-wrapper-3">Certificate is awarded to</div>
                                        <div className="group-8">
                                            <div className="overlap-group-3">
                                                <div className="text-wrapper-4">For successfully completing</div>
                                                <div className="decentralization">
                                                    {certificateData.courseName}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-wrapper-5 flex mx-auto items-center justify-center">
                                            {certificateData.student}
                                        </div>
                                        <img
                                            className="group-9"
                                            src="/group-323.png"
                                            alt="Group 323"
                                        />
                                        <div className="group-10">
                                            <div className="group-11">
                                                <div className="overlap-6">
                                                    <div className="overlap-group-4">
                                                        <div className="text-wrapper-6">Paul McOlaka</div>
                                                        <img
                                                            className="vector"
                                                            src="/vector-200.svg"
                                                            alt="Vector 200"
                                                        />
                                                        <img
                                                            className="vector-2"
                                                            src="/vector-202.svg"
                                                            alt="Vector 202"
                                                        />
                                                    </div>
                                                    <div className="text-wrapper-7">Executive Director</div>
                                                </div>
                                            </div>
                                            <div className="group-12">
                                                <div className="overlap-7">
                                                    <div className="overlap-8">
                                                        <p className="p">Director Strategy and Quality Assurance</p>
                                                        <div className="text-wrapper-8">Dr. Julian Rowa</div>
                                                        <img
                                                            className="vector-3"
                                                            src="/vector-203.svg"
                                                            alt="Vector 203"
                                                        />
                                                    </div>
                                                    <div className="overlap-9">
                                                        <img
                                                            className="vector-4"
                                                            src="/vector-201.svg"
                                                            alt="Vector 201"
                                                        />
                                                        <img
                                                            className="vector-5"
                                                            src="/vector-204.svg"
                                                            alt="Vector 204"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="group-wrapper">
                                        <div className="group-13">
                                            <img
                                                className="star"
                                                src="/star-6-1.svg"
                                                alt="Star 6-1"
                                            />
                                            <img
                                                className="star-2"
                                                src="/star-6-1.svg"
                                                alt="Star 6-1"
                                            />
                                            <img
                                                className="star-3"
                                                src="/star-7-1.svg"
                                                alt="Star 7-1"
                                            />
                                            <img
                                                className="star-4"
                                                src="/star-6-1.svg"
                                                alt="Star 6-1"
                                            />
                                            <img
                                                className="star-5"
                                                src="/star-7-1.svg"
                                                alt="Star 7-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-wrapper-9 flex mx-auto flex-col items-center justify-center w-full">
                                    Certificate ID: <span>
                                        {certificateData.certificateId.toString()}
                                    </span>
                                </p>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=http://0.0.0.0:8080/verify-certificate/?certificate_id=${certificateData.certificateId}`}
                                    alt="QR Code"
                                    className="h-[80px] relative mt-[580px] ml-[800px]"
                                />
                                <img
                                    className="logo"
                                    src="/logo-1.png"
                                    alt="Logo"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-5 space-x-5">
                    <button
                        id="download-pdf"
                        className="bg-cyan-950 hover:bg-yellow-500 p-3 text-white font-bold rounded-md"
                        onClick={downloadPDF}
                    >
                        Download as PDF
                    </button>
                    <button
                        id="download-jpeg"
                        className="bg-cyan-950 hover:bg-yellow-500 p-3 text-white font-bold rounded-md"
                        onClick={downloadJPEG}
                    >
                        Download as JPEG
                    </button>
                </div>
            </div>
        </div>
    );
};

Certificate.propTypes = {
    certificateData: PropTypes.object.isRequired,
};

export default Certificate;