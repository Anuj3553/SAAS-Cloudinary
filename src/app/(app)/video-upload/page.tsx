"use client"

import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function VideoUpload() {
    const [file, setFile] = React.useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const router = useRouter()

    // MAX file size is 100MB

    const MAX_FILE_SIZE = 100 * 1024 * 1024

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            // TODO : add notification
            alert('File size is too big')
            return
        }

        setIsUploading(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title)
        formData.append('description', description)
        formData.append("originalSize", file.size.toString())

        try {
            const response = await axios.post('/api/video-upload', formData)
            // Check for 200 response
            if (response.status === 200) {
                router.push(`/video/${response.data.public_id}`)
            } else {
                alert('Failed to upload video')
            }
        } catch (error) {
            console.log(error)
            alert('Failed to upload video')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div>
            <div className='container mx-auto p-4'>
                <h1 className='text-2xl font-bold mb-4'>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {/* Title field */}
                        <div>
                            <label className='label'>
                                <span className='label-text'>Title</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className='input input-bordered w-full'
                                required
                            />
                        </div>
                        {/* Description field */}
                        <div>
                            <label className='label'>
                                <span className='label-text'>Description</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className='textarea textarea-bordered w-full'
                                required
                            />
                        </div>
                        {/* Video field */}
                        <div>
                            <label className='label'>
                                <span className='label-text'>Video File</span>
                            </label>
                            <input
                                type="text"
                                accept='video/*'
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className='file-input input input-bordered w-full'
                                required
                            />
                        </div>
                        {/* Submit Button */}
                        <button
                            type='submit'
                            className='btn btn-primary'
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </h1>
            </div>
        </div>
    )
}
