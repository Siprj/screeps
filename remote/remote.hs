#!/usr/bin/env stack
-- stack --resolver lts-14.13 --install-ghc runghc --package wreq --package aeson --package text --package filemanip --package directory --package filepath --package lens --package bytestring
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}
module Main where

import Control.Exception
import Control.Lens hiding ((.=))
import Control.Monad
import Data.Aeson
import Data.Aeson.Types
import qualified Data.ByteString.Char8 as BS
import Data.Monoid
import Data.Text hiding (find)
import Network.Wreq
import System.Directory
import System.Environment
import System.FilePath
import System.FilePath.Find
import System.IO


data Tokens = Tokens
    { tokens :: Map String ByteString
    }

$(deriveJSON defaultOptions ''Tokens)

data Protocol = Http | Https

$(deriveJSON defaultOptions ''Protocol)


data ConfigurationBit = ConfigurationBit
    { protocol :: Protocol
    , hostName :: String
    , hostPort :: Int
    , destinationBranch :: String
    }

$(deriveJSON defaultOptions ''ConfigurationBit)

data Configuration = Configuration (Map String ConfigurationBit)

$(deriveJSON defaultOptions ''Configuration)


-- Configuration
artefactDirectory = "dist"
dstBranch = "default"


main :: IO ()
main = do
    print $ "Branch: " <> dstBranch
    curDir <- getCurrentDirectory
    (userName, password) <- getUserNameAndPassword
    jss <- findJs $ curDir </> artefactDirectory
    modules <- mapM (fileToModule $ curDir </> artefactDirectory) jss
    sendPost userName password $ SourcePushReq dstBranch modules

sendPost :: String -> String -> SourcePushReq -> IO ()
sendPost user pass reqData = do
    let opts = defaults & auth ?~ basicAuth (BS.pack user) (BS.pack pass)
    void . postWith opts "https://screeps.com/api/user/code" $ toJSON reqData

getUserNameAndPassword :: IO (String, String)
getUserNameAndPassword = do
    userName <- lookupEnv "SCREEPS_USER" >>= maybe getUserName return
    password <- lookupEnv "SCREEPS_PASSWORD" >>= maybe getPassword return
    return (userName, password)
  where
    getUserName = do
        putStrLn "Type user name or email:"
        getLine
    getPassword = do
        putStrLn "Type password:"
        withoutEcho getLine

withoutEcho :: IO a -> IO a
withoutEcho action = do
    old <- hGetEcho stdin
    bracket_ (hSetEcho stdin False) (hSetEcho stdin old) action

fileToModule :: FilePath -> FilePath -> IO SourceModule
fileToModule dir file = do
    content <- readFile (dir </> file)
    return SourceModule
        { name = pack . Prelude.drop 2 . maybe file id $ stripExtension ".js" file
        , content = content
        }

findJs :: FilePath -> IO [FilePath]
findJs dir = withCurrentDirectory dir $ do
    res <- find always (extension ==? ".js") "./"
    putStrLn "Using files:"
    print res
    return res

data SourcePushReq = SourcePushReq
    { branch :: Text
    , modules :: [SourceModule]
    }

instance ToJSON SourcePushReq where
    toJSON SourcePushReq{..} = object
        [ "branch" .= branch
        , "modules" .= object (fmap mkModule modules)
        ]
      where
        mkModule :: SourceModule -> Pair
        mkModule SourceModule{..} = name .= content

data SourceModule = SourceModule
    { name :: Text
    , content :: String
    }
