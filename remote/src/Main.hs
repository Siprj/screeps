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


-- Configuration
artefactDirectory = "dist" </> "out"
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
